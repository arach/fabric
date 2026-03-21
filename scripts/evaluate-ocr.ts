import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

type StrategyResult = {
  strategy: string;
  success: boolean;
  buildMs?: number;
  setupMs?: number;
  coldMs?: number;
  warmMs?: number;
  textChars?: number;
  preview?: string;
  notes?: string[];
  error?: string;
};

type CliOptions = {
  pdf: string;
  page: number;
  language: string;
  bakedImageTag: string;
  skipBuild: boolean;
  thirdPartyImage?: string;
  thirdPartyCommand?: string;
};

const repoRoot = resolve(import.meta.dir, "..");
const defaultBakedImageTag = "fabric-ocr:local";

function parseArgs(argv: string[]): CliOptions {
  let pdf = "";
  let page = 1;
  let language = "eng";
  let bakedImageTag = defaultBakedImageTag;
  let skipBuild = false;
  let thirdPartyImage: string | undefined;
  let thirdPartyCommand: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--pdf") {
      pdf = argv[++i] ?? "";
    } else if (arg === "--page") {
      page = Number.parseInt(argv[++i] ?? "1", 10);
    } else if (arg === "--language") {
      language = argv[++i] ?? language;
    } else if (arg === "--baked-image-tag") {
      bakedImageTag = argv[++i] ?? bakedImageTag;
    } else if (arg === "--skip-build") {
      skipBuild = true;
    } else if (arg === "--third-party-image") {
      thirdPartyImage = argv[++i] ?? "";
    } else if (arg === "--third-party-command") {
      thirdPartyCommand = argv[++i] ?? "";
    }
  }

  if (!pdf) {
    throw new Error("Missing required argument: --pdf /absolute/path/to/file.pdf");
  }

  return {
    pdf: resolve(pdf),
    page,
    language,
    bakedImageTag,
    skipBuild,
    thirdPartyImage,
    thirdPartyCommand,
  };
}

async function run(cmd: string[], cwd = repoRoot) {
  const started = performance.now();
  const proc = Bun.spawn({
    cmd,
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return {
    stdout,
    stderr,
    exitCode,
    durationMs: Math.round(performance.now() - started),
  };
}

function formatVolume(source: string, target: string, readOnly = false) {
  return readOnly ? `${source}:${target}:ro` : `${source}:${target}`;
}

async function ensureContainerAvailable() {
  const result = await run(["container", "--version"]);
  if (result.exitCode !== 0) {
    throw new Error(`Apple container CLI is not available.\n${result.stderr || result.stdout}`);
  }
}

async function buildBakedImage(tag: string) {
  const result = await run([
    "container",
    "build",
    "--progress",
    "plain",
    "-t",
    tag,
    "-f",
    "images/ocr/Dockerfile",
    ".",
  ]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to build OCR image.\n${result.stderr || result.stdout}`);
  }

  return result.durationMs;
}

async function startContainer(name: string, image: string, volumes: string[]) {
  const result = await run([
    "container",
    "run",
    "-d",
    "--rm",
    "--name",
    name,
    "--progress",
    "none",
    ...volumes.flatMap((volume) => ["-v", volume]),
    image,
    "sleep",
    "infinity",
  ]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to start container ${name}.\n${result.stderr || result.stdout}`);
  }
}

async function execInContainer(name: string, command: string) {
  const result = await run(["container", "exec", name, "bash", "-lc", command]);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed in ${name}`);
  }
  return result.durationMs;
}

async function stopContainer(name: string) {
  await run(["container", "stop", name]);
}

async function readJsonResult(outputPath: string) {
  const raw = await readFile(outputPath, "utf8");
  return JSON.parse(raw) as { text?: string };
}

async function evaluateRecipe(options: CliOptions, workDir: string): Promise<StrategyResult> {
  const strategy = "recipe-ubuntu";
  const containerName = `fabric-ocr-recipe-${Date.now()}`;
  const pdfDir = dirname(options.pdf);
  const pdfFile = basename(options.pdf);
  const outputDir = join(workDir, strategy);
  const toolDir = join(repoRoot, "images/ocr");
  const outputPath = join(outputDir, "result.json");

  await mkdir(outputDir, { recursive: true });

  try {
    await startContainer(containerName, "ubuntu:24.04", [
      formatVolume(pdfDir, "/input", true),
      formatVolume(outputDir, "/output"),
      formatVolume(toolDir, "/tool", true),
    ]);

    const setupMs = await execInContainer(
      containerName,
      [
        "apt-get update",
        "apt-get install -y --no-install-recommends bash ca-certificates poppler-utils python3-minimal tesseract-ocr tesseract-ocr-eng",
        "rm -rf /var/lib/apt/lists/*",
      ].join(" && "),
    );

    const coldMs = await execInContainer(
      containerName,
      `bash /tool/ocr-page.sh --input /input/${pdfFile} --page ${options.page} --language ${options.language} --output /output/result.json >/dev/null`,
    );

    const warmMs = await execInContainer(
      containerName,
      `bash /tool/ocr-page.sh --input /input/${pdfFile} --page ${options.page} --language ${options.language} --output /output/result.json >/dev/null`,
    );

    const json = await readJsonResult(outputPath);
    const text = json.text ?? "";

    return {
      strategy,
      success: true,
      setupMs,
      coldMs: setupMs + coldMs,
      warmMs,
      textChars: text.length,
      preview: text.slice(0, 160).replace(/\s+/g, " ").trim(),
      notes: ["Cold time includes apt install plus first OCR run."],
    };
  } catch (error) {
    return {
      strategy,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await stopContainer(containerName);
  }
}

async function evaluateBakedImage(
  options: CliOptions,
  workDir: string,
  buildMs?: number,
): Promise<StrategyResult> {
  const strategy = "baked-image";
  const containerName = `fabric-ocr-baked-${Date.now()}`;
  const pdfDir = dirname(options.pdf);
  const pdfFile = basename(options.pdf);
  const outputDir = join(workDir, strategy);
  const outputPath = join(outputDir, "result.json");

  await mkdir(outputDir, { recursive: true });

  try {
    await startContainer(containerName, options.bakedImageTag, [
      formatVolume(pdfDir, "/input", true),
      formatVolume(outputDir, "/output"),
    ]);

    const coldMs = await execInContainer(
      containerName,
      `ocr-page --input /input/${pdfFile} --page ${options.page} --language ${options.language} --output /output/result.json >/dev/null`,
    );

    const warmMs = await execInContainer(
      containerName,
      `ocr-page --input /input/${pdfFile} --page ${options.page} --language ${options.language} --output /output/result.json >/dev/null`,
    );

    const json = await readJsonResult(outputPath);
    const text = json.text ?? "";

    return {
      strategy,
      success: true,
      buildMs,
      coldMs,
      warmMs,
      textChars: text.length,
      preview: text.slice(0, 160).replace(/\s+/g, " ").trim(),
    };
  } catch (error) {
    return {
      strategy,
      success: false,
      buildMs,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await stopContainer(containerName);
  }
}

async function evaluateThirdParty(
  options: CliOptions,
  workDir: string,
): Promise<StrategyResult | null> {
  if (!options.thirdPartyImage) return null;

  const strategy = "third-party-image";
  const containerName = `fabric-ocr-third-${Date.now()}`;
  const pdfDir = dirname(options.pdf);
  const pdfFile = basename(options.pdf);
  const outputDir = join(workDir, strategy);
  const outputPath = join(outputDir, "result.json");
  const commandTemplate =
    options.thirdPartyCommand ??
    "ocr-page --input /input/__PDF__ --page __PAGE__ --language __LANG__ --output /output/result.json >/dev/null";
  const command = commandTemplate
    .replaceAll("__PDF__", pdfFile)
    .replaceAll("__PAGE__", String(options.page))
    .replaceAll("__LANG__", options.language);

  await mkdir(outputDir, { recursive: true });

  try {
    await startContainer(containerName, options.thirdPartyImage, [
      formatVolume(pdfDir, "/input", true),
      formatVolume(outputDir, "/output"),
    ]);

    const coldMs = await execInContainer(containerName, command);
    const warmMs = await execInContainer(containerName, command);
    const json = await readJsonResult(outputPath);
    const text = json.text ?? "";

    return {
      strategy,
      success: true,
      coldMs,
      warmMs,
      textChars: text.length,
      preview: text.slice(0, 160).replace(/\s+/g, " ").trim(),
      notes: ["Command supplied through --third-party-command or defaulted to the ocr-page contract."],
    };
  } catch (error) {
    return {
      strategy,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await stopContainer(containerName);
  }
}

function printSummary(results: StrategyResult[], outputDir: string) {
  console.log("");
  console.log("OCR image evaluation");
  console.log(`Output directory: ${outputDir}`);
  console.log("");

  for (const result of results) {
    console.log(`- ${result.strategy}`);
    if (!result.success) {
      console.log(`  failed: ${result.error}`);
      continue;
    }
    if (typeof result.buildMs === "number") {
      console.log(`  build: ${result.buildMs} ms`);
    }
    if (typeof result.setupMs === "number") {
      console.log(`  setup: ${result.setupMs} ms`);
    }
    if (typeof result.coldMs === "number") {
      console.log(`  cold: ${result.coldMs} ms`);
    }
    if (typeof result.warmMs === "number") {
      console.log(`  warm: ${result.warmMs} ms`);
    }
    if (typeof result.textChars === "number") {
      console.log(`  text chars: ${result.textChars}`);
    }
    if (result.preview) {
      console.log(`  preview: ${result.preview}`);
    }
    for (const note of result.notes ?? []) {
      console.log(`  note: ${note}`);
    }
  }
  console.log("");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await ensureContainerAvailable();

  const outputDir = await mkdtemp(join(tmpdir(), "fabric-ocr-eval-"));
  const results: StrategyResult[] = [];

  let buildMs: number | undefined;
  if (!options.skipBuild) {
    buildMs = await buildBakedImage(options.bakedImageTag);
  }

  results.push(await evaluateRecipe(options, outputDir));
  results.push(await evaluateBakedImage(options, outputDir, buildMs));

  const thirdParty = await evaluateThirdParty(options, outputDir);
  if (thirdParty) results.push(thirdParty);

  printSummary(results, outputDir);
}

await main().finally(async () => {
  // Evaluation artifacts are useful for inspection. Do not auto-delete.
});
