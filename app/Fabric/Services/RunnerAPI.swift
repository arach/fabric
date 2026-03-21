import Foundation
import Network

/// Lightweight HTTP server that Linia (and other clients) can call to run scripts
/// on the Fabric Runner.
///
/// Endpoints:
///   GET  /health              → { "status": "ok", "runtime": true|false }
///   POST /run                 → { "script": "https://...", "params": {...} }
///   GET  /jobs/{id}           → job status + output
///
final class RunnerAPI: @unchecked Sendable {
    static let defaultPort: UInt16 = 8765

    private let listener: NWListener
    private let monitor: RunnerMonitor
    private var jobs: [String: Job] = [:]
    private let queue = DispatchQueue(label: "run.fab.api")

    struct Job {
        let id: String
        let script: String
        var status: String  // pending, running, done, failed
        var output: String
        var exitCode: Int32?
    }

    init(monitor: RunnerMonitor, port: UInt16 = RunnerAPI.defaultPort) {
        self.monitor = monitor
        let params = NWParameters.tcp
        params.allowLocalEndpointReuse = true
        self.listener = try! NWListener(using: params, on: NWEndpoint.Port(rawValue: port)!)
    }

    func start() {
        listener.newConnectionHandler = { [weak self] connection in
            self?.handleConnection(connection)
        }
        listener.start(queue: queue)
    }

    private func handleConnection(_ connection: NWConnection) {
        connection.start(queue: queue)
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, _, _, error in
            guard let self, let data, error == nil else {
                connection.cancel()
                return
            }
            self.route(data: data, connection: connection)
        }
    }

    private func route(data: Data, connection: NWConnection) {
        guard let request = String(data: data, encoding: .utf8) else {
            respond(connection: connection, status: 400, body: #"{"error":"bad request"}"#)
            return
        }

        let lines = request.split(separator: "\r\n", maxSplits: 1)
        guard let requestLine = lines.first else {
            respond(connection: connection, status: 400, body: #"{"error":"bad request"}"#)
            return
        }

        let parts = requestLine.split(separator: " ")
        guard parts.count >= 2 else {
            respond(connection: connection, status: 400, body: #"{"error":"bad request"}"#)
            return
        }

        let method = String(parts[0])
        let path = String(parts[1])

        switch (method, path) {
        case ("GET", "/health"):
            let running = DispatchQueue.main.sync { monitor.isRunning }
            respond(connection: connection, status: 200, body: #"{"status":"ok","runtime":\#(running)}"#)

        case ("POST", "/run"):
            handleRun(request: request, connection: connection)

        case ("GET", _) where path.hasPrefix("/jobs/"):
            let id = String(path.dropFirst("/jobs/".count))
            if let job = jobs[id] {
                let exit = job.exitCode.map { String($0) } ?? "null"
                let escaped = job.output.replacingOccurrences(of: "\"", with: "\\\"")
                    .replacingOccurrences(of: "\n", with: "\\n")
                respond(connection: connection, status: 200,
                        body: #"{"id":"\#(job.id)","status":"\#(job.status)","exitCode":\#(exit),"output":"\#(escaped)"}"#)
            } else {
                respond(connection: connection, status: 404, body: #"{"error":"job not found"}"#)
            }

        default:
            respond(connection: connection, status: 404, body: #"{"error":"not found"}"#)
        }
    }

    private func handleRun(request: String, connection: NWConnection) {
        // Extract JSON body after blank line
        guard let bodyRange = request.range(of: "\r\n\r\n") else {
            respond(connection: connection, status: 400, body: #"{"error":"no body"}"#)
            return
        }

        let bodyStr = String(request[bodyRange.upperBound...])
        guard let bodyData = bodyStr.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: bodyData) as? [String: Any],
              let script = json["script"] as? String
        else {
            respond(connection: connection, status: 400, body: #"{"error":"missing script field"}"#)
            return
        }

        let params = json["params"] as? [String: String] ?? [:]
        let jobId = String(UUID().uuidString.prefix(8).lowercased())

        let job = Job(id: jobId, script: script, status: "pending", output: "")
        jobs[job.id] = job

        respond(connection: connection, status: 202, body: #"{"id":"\#(jobId)","status":"pending"}"#)

        // Run async
        let capturedId = jobId
        queue.async { [weak self] in
            guard let self else { return }
            self.jobs[capturedId]?.status = "running"

            let result = self.runScript(script: script, params: params)

            self.jobs[capturedId]?.status = result.status == 0 ? "done" : "failed"
            self.jobs[capturedId]?.output = result.output
            self.jobs[capturedId]?.exitCode = result.status
        }
    }

    private func runScript(script: String, params: [String: String]) -> (status: Int32, output: String) {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env")

        // If script is a URL, download and run it
        if script.hasPrefix("http://") || script.hasPrefix("https://") {
            process.arguments = ["bash", "-c", "curl -fsSL '\(script)' | bash -s -- " + params.map { "\($0.key)=\($0.value)" }.joined(separator: " ")]
        } else {
            process.arguments = ["bash", "-c", script]
        }

        var env = ProcessInfo.processInfo.environment
        let path = env["PATH"] ?? "/usr/bin:/bin"
        env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:\(path)"
        for (k, v) in params {
            env["FABRIC_PARAM_\(k.uppercased())"] = v
        }
        process.environment = env

        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe

        do {
            try process.run()
            process.waitUntilExit()
        } catch {
            return (-1, error.localizedDescription)
        }

        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return (process.terminationStatus, output)
    }

    private func respond(connection: NWConnection, status: Int, body: String) {
        let statusText: String
        switch status {
        case 200: statusText = "OK"
        case 202: statusText = "Accepted"
        case 400: statusText = "Bad Request"
        case 404: statusText = "Not Found"
        default: statusText = "Error"
        }

        let response = """
        HTTP/1.1 \(status) \(statusText)\r
        Content-Type: application/json\r
        Access-Control-Allow-Origin: *\r
        Content-Length: \(body.utf8.count)\r
        Connection: close\r
        \r
        \(body)
        """

        connection.send(content: response.data(using: .utf8), contentContext: .finalMessage, isComplete: true, completion: .contentProcessed { _ in
            connection.cancel()
        })
    }
}
