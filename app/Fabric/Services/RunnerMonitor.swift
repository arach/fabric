import Foundation

/// Monitors the Apple container runtime by checking `container system status`.
@MainActor
final class RunnerMonitor: ObservableObject {
    @Published var isRunning = false
    @Published var builderReady = false
    @Published var runnerHomeExists = false
    @Published var lastError: String?

    private var timer: Timer?

    private let runnerHome: String = {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        return ProcessInfo.processInfo.environment["FABRIC_RUNNER_HOME"]
            ?? "\(home)/.fabric-runner"
    }()

    func start() {
        checkNow()
        timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.checkNow()
            }
        }
    }

    func stop() {
        timer?.invalidate()
        timer = nil
    }

    func checkNow() {
        // Check container system
        let systemStatus = shell("/usr/bin/env", ["container", "system", "status"])
        isRunning = systemStatus.status == 0

        // Check builder
        let builderStatus = shell("/usr/bin/env", ["container", "builder", "status"])
        builderReady = builderStatus.status == 0

        // Check runner home
        runnerHomeExists = FileManager.default.fileExists(atPath: runnerHome)

        lastError = nil
    }

    nonisolated private func shell(_ executable: String, _ arguments: [String]) -> (status: Int32, output: String) {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments

        // Include Homebrew in PATH for Apple Silicon
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
