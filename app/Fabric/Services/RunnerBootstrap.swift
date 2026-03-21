import Foundation

/// Runs the Fabric Runner bootstrap sequence — same logic as install-runner.sh
/// but driven from Swift so we can show progress in the menu bar app.
enum RunnerBootstrap {
    static let runnerHome: String = {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        return ProcessInfo.processInfo.environment["FABRIC_RUNNER_HOME"]
            ?? "\(home)/.fabric-runner"
    }()

    @MainActor
    static func run() async {
        // 1. Start container system
        _ = shell("container", ["system", "start"])

        // 2. Start builder if needed
        let builderStatus = shell("container", ["builder", "status"])
        if builderStatus.status != 0 {
            _ = shell("container", ["builder", "start"])
        }

        // 3. Create runner home directories
        let fm = FileManager.default
        let dirs = ["config", "cache", "logs", "state"]
        for dir in dirs {
            let path = "\(runnerHome)/\(dir)"
            try? fm.createDirectory(atPath: path, withIntermediateDirectories: true)
        }
    }

    nonisolated private static func shell(_ command: String, _ arguments: [String]) -> (status: Int32, output: String) {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        process.arguments = [command] + arguments

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
