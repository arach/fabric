import { describe, expect, test } from "bun:test"
import {
  providerToEnv,
  encodeFileForCheckpoint,
  decodeFileFromCheckpoint,
} from "./index"

describe("providerToEnv", () => {
  test("anthropic returns ANTHROPIC_API_KEY", () => {
    const env = providerToEnv({ provider: "anthropic", apiKey: "sk-test" })
    expect(env).toEqual({ ANTHROPIC_API_KEY: "sk-test" })
  })

  test("bedrock returns AWS vars", () => {
    const env = providerToEnv({
      provider: "bedrock",
      region: "us-west-2",
      profile: "dev",
      accessKeyId: "AKIA...",
      secretAccessKey: "secret",
    })
    expect(env).toEqual({
      AWS_REGION: "us-west-2",
      AWS_PROFILE: "dev",
      AWS_ACCESS_KEY_ID: "AKIA...",
      AWS_SECRET_ACCESS_KEY: "secret",
    })
  })

  test("bedrock omits optional fields when not provided", () => {
    const env = providerToEnv({ provider: "bedrock", region: "us-east-1" })
    expect(env).toEqual({ AWS_REGION: "us-east-1" })
    expect(env).not.toHaveProperty("AWS_PROFILE")
    expect(env).not.toHaveProperty("AWS_ACCESS_KEY_ID")
  })

  test("vertex defaults region to global", () => {
    const env = providerToEnv({ provider: "vertex", projectId: "my-proj" })
    expect(env).toEqual({
      ANTHROPIC_VERTEX_PROJECT_ID: "my-proj",
      CLOUD_ML_REGION: "global",
    })
  })

  test("vertex uses provided region", () => {
    const env = providerToEnv({
      provider: "vertex",
      projectId: "my-proj",
      region: "europe-west1",
    })
    expect(env.CLOUD_ML_REGION).toBe("europe-west1")
  })

  test("azure returns foundry vars", () => {
    const env = providerToEnv({
      provider: "azure",
      apiKey: "az-key",
      resource: "my-resource",
    })
    expect(env).toEqual({
      ANTHROPIC_FOUNDRY_API_KEY: "az-key",
      ANTHROPIC_FOUNDRY_RESOURCE: "my-resource",
    })
  })

  test("vercel returns gateway token", () => {
    const env = providerToEnv({ provider: "vercel", token: "vt-123" })
    expect(env).toEqual({ VERCEL_AI_GATEWAY_TOKEN: "vt-123" })
  })
})

describe("encodeFileForCheckpoint / decodeFileFromCheckpoint", () => {
  test("string content roundtrips as utf8", () => {
    const encoded = encodeFileForCheckpoint("/test.txt", "hello world")
    expect(encoded.encoding).toBe("utf8")
    expect(encoded.content).toBe("hello world")

    const decoded = decodeFileFromCheckpoint(encoded)
    expect(decoded.path).toBe("/test.txt")
    expect(decoded.content.toString("utf8")).toBe("hello world")
  })

  test("buffer content roundtrips as base64", () => {
    const original = Buffer.from([0x00, 0xff, 0x42, 0x13])
    const encoded = encodeFileForCheckpoint("/bin.dat", original)
    expect(encoded.encoding).toBe("base64")

    const decoded = decodeFileFromCheckpoint(encoded)
    expect(decoded.path).toBe("/bin.dat")
    expect(Buffer.compare(decoded.content, original)).toBe(0)
  })
})
