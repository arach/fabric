// Simple Bun HTTP server for testing
const server = Bun.serve({
  hostname: "0.0.0.0",  // Bind to all interfaces
  port: 9000,
  fetch(req) {
    const url = new URL(req.url)
    console.log(`${req.method} ${url.pathname}`)

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        runtime: "container",
        timestamp: new Date().toISOString(),
      })
    }

    if (url.pathname === "/files") {
      const files = require("fs").readdirSync("/workspace")
      return Response.json({ files })
    }

    return Response.json({
      message: "Hello from inside the container!",
      path: url.pathname
    })
  },
})

console.log(`Server running at http://0.0.0.0:${server.port}`)
