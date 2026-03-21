import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { tmpdir } from "node:os";

const PORT = Number.parseInt(process.env.PORT || "52157", 10);
const OCR_IMAGE = process.env.FABRIC_RUNNER_OCR_IMAGE || "fabric-ocr:local";

type RunnerJobStatus = "queued" | "running" | "completed" | "failed";

type OcrPageJobRequest = {
  type: "ocr.page";
  input: {
    pdfPath: string;
    page: number;
    language?: string;
  };
};

type RunnerJob = {
  id: string;
  type: "ocr.page";
  status: RunnerJobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  input: OcrPageJobRequest["input"];
  result?: unknown;
  error?: string;
};

const jobs = new Map<string, RunnerJob>();

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data, null, 2), { ...init, headers });
}

async function run(cmd: string[]) {
  const proc = Bun.spawn({
    cmd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { stdout, stderr, exitCode };
}

async function containerAvailable() {
  const result = await run(["container", "--version"]);
  return result.exitCode === 0;
}

async function ocrImageAvailable() {
  const result = await run(["container", "image", "inspect", OCR_IMAGE]);
  return result.exitCode === 0;
}

async function getCapabilities() {
  const [containerReady, imageReady] = await Promise.all([
    containerAvailable(),
    ocrImageAvailable(),
  ]);

  return {
    service: "fabric-runner",
    version: "0.2.0",
    transport: "http",
    tasks: ["ocr.page"],
    container: {
      available: containerReady,
    },
    ocr: {
      image: OCR_IMAGE,
      imageAvailable: imageReady,
      languages: ["eng"],
    },
  };
}

async function executeOcrPage(job: RunnerJob) {
  const { pdfPath, page, language = "eng" } = job.input;
  const scratchRoot = await mkdtemp(join(tmpdir(), "fabric-runner-ocr-"));
  const outputDir = join(scratchRoot, "output");
  const outputPath = join(outputDir, "result.json");

  await mkdir(outputDir, { recursive: true });

  try {
    const result = await run([
      "container",
      "run",
      "--rm",
      "--progress",
      "none",
      "-v",
      `${dirname(pdfPath)}:/input:ro`,
      "-v",
      `${outputDir}:/output`,
      OCR_IMAGE,
      "ocr-page",
      "--input",
      `/input/${basename(pdfPath)}`,
      "--page",
      String(page),
      "--language",
      language,
      "--output",
      "/output/result.json",
    ]);

    if (result.exitCode !== 0) {
      throw new Error(result.stderr || result.stdout || "OCR execution failed");
    }

    const raw = await readFile(outputPath, "utf8");
    return JSON.parse(raw);
  } finally {
    await rm(scratchRoot, { recursive: true, force: true });
  }
}

function scheduleOcrPage(job: RunnerJob) {
  void (async () => {
    job.status = "running";
    job.startedAt = new Date().toISOString();

    try {
      job.result = await executeOcrPage(job);
      job.status = "completed";
      job.completedAt = new Date().toISOString();
    } catch (error) {
      job.status = "failed";
      job.completedAt = new Date().toISOString();
      job.error = error instanceof Error ? error.message : String(error);
    }
  })();
}

async function createOcrPageJob(input: OcrPageJobRequest["input"]) {
  const job: RunnerJob = {
    id: crypto.randomUUID(),
    type: "ocr.page",
    status: "queued",
    createdAt: new Date().toISOString(),
    input,
  };

  jobs.set(job.id, job);
  scheduleOcrPage(job);
  return job;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "OPTIONS") {
      return json({});
    }

    if (path === "/health" && req.method === "GET") {
      return json({
        status: "ok",
        service: "fabric-runner",
        version: "0.2.0",
        uptime: process.uptime(),
      });
    }

    if (path === "/capabilities" && req.method === "GET") {
      return json(await getCapabilities());
    }

    if (path === "/jobs" && req.method === "POST") {
      const body = (await req.json()) as Partial<OcrPageJobRequest>;

      if (body.type !== "ocr.page") {
        return json({ error: "Unsupported job type" }, { status: 400 });
      }

      const pdfPath = body.input?.pdfPath;
      const page = body.input?.page;
      const language = body.input?.language || "eng";

      if (!pdfPath || !existsSync(pdfPath)) {
        return json({ error: "Input pdfPath does not exist" }, { status: 400 });
      }

      if (!Number.isInteger(page) || Number(page) < 1) {
        return json({ error: "Input page must be a positive integer" }, { status: 400 });
      }

      const capabilities = await getCapabilities();

      if (!capabilities.container.available) {
        return json({ error: "Apple container runtime is unavailable" }, { status: 503 });
      }

      if (!capabilities.ocr.imageAvailable) {
        return json(
          {
            error: `OCR image '${OCR_IMAGE}' is unavailable`,
            hint: "Build or pull the OCR image before submitting jobs.",
          },
          { status: 503 },
        );
      }

      const job = await createOcrPageJob({
        pdfPath,
        page: Number(page),
        language,
      });

      return json({ job }, { status: 202 });
    }

    const jobMatch = path.match(/^\/jobs\/([^/]+)$/);
    if (jobMatch && req.method === "GET") {
      const job = jobs.get(jobMatch[1]);
      if (!job) {
        return json({ error: "Job not found" }, { status: 404 });
      }

      return json({ job });
    }

    return json({ error: "Not found" }, { status: 404 });
  },
});

const runtimeInfoPath = join(
  process.env.HOME || tmpdir(),
  ".fabric-runner",
  "state",
  "runtime.json",
);

await mkdir(dirname(runtimeInfoPath), { recursive: true });
await writeFile(
  runtimeInfoPath,
  JSON.stringify(
    {
      service: "fabric-runner",
      version: "0.2.0",
      host: "127.0.0.1",
      port: PORT,
      baseUrl: `http://127.0.0.1:${PORT}`,
      updatedAt: new Date().toISOString(),
    },
    null,
    2,
  ) + "\n",
);

console.log(`Fabric Runner listening on http://127.0.0.1:${server.port}`);
