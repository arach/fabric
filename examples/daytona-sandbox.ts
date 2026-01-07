#!/usr/bin/env bun
/**
 * Daytona Sandbox Example
 *
 * Test creating and running code in a Daytona sandbox
 */

import { Daytona } from "@daytonaio/sdk"
import "dotenv/config"

const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY

if (!DAYTONA_API_KEY) {
  console.error("DAYTONA_API_KEY not set")
  process.exit(1)
}

async function main() {
  console.log("Initializing Daytona client...")
  const daytona = new Daytona({
    apiKey: DAYTONA_API_KEY,
  })

  let sandbox
  try {
    console.log("Creating sandbox...")
    sandbox = await daytona.create({
      language: "typescript",
    })
    console.log(`Sandbox created: ${sandbox.id}`)

    // Run some TypeScript code
    console.log("\nRunning TypeScript code...")
    const response = await sandbox.process.codeRun(`
      const message = "Hello from Daytona sandbox!";
      console.log(message);
      console.log("2 + 2 =", 2 + 2);
    `)

    if (response.exitCode !== 0) {
      console.error("Error:", response.exitCode, response.result)
    } else {
      console.log("Output:", response.result)
    }

    // Run a shell command
    console.log("\nRunning shell command...")
    const cmdResponse = await sandbox.process.executeCommand("uname -a")
    console.log("System info:", cmdResponse.result)

    // List files
    console.log("\nListing files...")
    const files = await sandbox.fs.listFiles("/")
    console.log("Root files:", files.slice(0, 10).map(f => f.name).join(", "))

  } catch (error) {
    console.error("Error:", error)
  } finally {
    if (sandbox) {
      console.log("\nCleaning up sandbox...")
      await sandbox.delete()
      console.log("Done!")
    }
  }
}

main().catch(console.error)
