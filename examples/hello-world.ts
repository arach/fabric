/**
 * Hello World Example
 *
 * Demonstrates basic task submission to Fabric
 */

const FABRIC_URL = process.env.FABRIC_URL || "http://localhost:8765"

async function main() {
  console.log("🧵 Fabric Hello World Example\n")

  // 1. Check health
  console.log("Checking server health...")
  const health = await fetch(`${FABRIC_URL}/health`).then((r) => r.json())
  console.log("Health:", health)

  // 2. List runtimes
  console.log("\nAvailable runtimes:")
  const { runtimes } = await fetch(`${FABRIC_URL}/runtimes`).then((r) =>
    r.json()
  )
  for (const rt of runtimes) {
    const icon = rt.available ? "✅" : "❌"
    console.log(`  ${icon} ${rt.type}: ${rt.message}`)
  }

  // 3. Submit a simple task
  console.log("\nSubmitting task...")
  const { task } = await fetch(`${FABRIC_URL}/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "code-execution",
      code: 'console.log("Hello from Fabric!")',
      runtime: "local-subprocess",
    }),
  }).then((r) => r.json())

  console.log("Task created:", task.id)
  console.log("Status:", task.status)

  // 4. Poll for completion
  console.log("\nWaiting for completion...")
  let attempts = 0
  while (attempts < 10) {
    await new Promise((r) => setTimeout(r, 500))
    const { task: updated } = await fetch(
      `${FABRIC_URL}/task/${task.id}`
    ).then((r) => r.json())

    if (updated.status === "completed" || updated.status === "failed") {
      console.log("\n--- Result ---")
      console.log("Status:", updated.status)
      console.log("Output:", updated.output)
      if (updated.error) console.log("Error:", updated.error)
      break
    }

    attempts++
  }
}

main().catch(console.error)
