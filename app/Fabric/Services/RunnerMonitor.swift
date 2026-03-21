import Foundation

/// Monitors the Apple container runtime status.
/// Polls lazily — only checks on demand (menu open, settings view, manual refresh).
@MainActor
final class RunnerMonitor: ObservableObject {
    @Published var isRunning = false
    @Published var builderReady = false
    @Published var runnerHomeExists = false
    @Published var lastError: String?
    @Published var lastChecked: Date?

    private let runnerHome: String = {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        return ProcessInfo.processInfo.environment["FABRIC_RUNNER_HOME"]
            ?? "\(home)/.fabric-runner"
    }()

    /// Initial check on launch — no recurring timer.
    func start() {
        checkNow()
    }

    func checkNow() {
        // Runner home is cheap — just a file existence check
        runnerHomeExists = FileManager.default.fileExists(atPath: runnerHome)

        // Shell out for container status
        let systemStatus = Self.shell("/usr/bin/env", ["container", "system", "status"])
        let builderStatus = Self.shell("/usr/bin/env", ["container", "builder", "status"])

        isRunning = systemStatus.status == 0
        builderReady = builderStatus.status == 0
        lastError = nil
        lastChecked = Date()
    }

    nonisolated private static func shell(_ executable: String, _ arguments: [String]) -> (status: Int32, output: String) {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments

        var env = ProcessInfo.processInfo.environment
        let path = env["PATH"] ?? "/usr/bin:/bin"
        env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:\(path)"
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
}
