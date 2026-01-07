//
//  FabricContainer
//
//  Local container runtime using Apple's Containerization framework
//  Provides a CLI interface for the TypeScript runtime-local adapter
//

import Foundation
import Containerization
import ContainerizationOS

// MARK: - Container Manager

actor ContainerRuntime {

    struct Config {
        var kernelPath: String
        var memoryMiB: Int = 512
        var cpuCount: Int = 2
    }

    private var managers: [String: ContainerManager] = [:]
    private var containers: [String: LinuxContainer] = [:]
    private let config: Config

    init(config: Config) {
        self.config = config
    }

    /// Run a new container and execute a command
    func run(
        id: String,
        image: String,
        command: [String],
        workdir: String = "/",
        env: [String: String] = [:]
    ) async throws -> (stdout: String, stderr: String, exitCode: Int32) {

        let kernel = Kernel(
            path: URL(fileURLWithPath: config.kernelPath),
            platform: .linuxArm
        )

        var manager = try await ContainerManager(
            kernel: kernel,
            initfsReference: "ghcr.io/apple/containerization/vminit:0.13.0",
            network: try ContainerManager.VmnetNetwork()
        )

        // Build environment variables array
        var envVars = ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"]
        for (key, value) in env {
            envVars.append("\(key)=\(value)")
        }

        // Capture config values to avoid actor isolation issues
        let cpuCount = config.cpuCount
        let memoryMiB = config.memoryMiB

        let container = try await manager.create(
            id,
            reference: image,
            rootfsSizeInBytes: 2 * 1024 * 1024 * 1024  // 2 GiB
        ) { containerConfig in
            containerConfig.cpus = cpuCount
            containerConfig.memoryInBytes = UInt64(memoryMiB) * 1024 * 1024
            containerConfig.process.arguments = command
            containerConfig.process.workingDirectory = workdir
            containerConfig.process.environmentVariables = envVars
        }

        try await container.create()
        try await container.start()

        // Wait for container to complete
        let exitStatus = try await container.wait()

        // Clean up
        try await container.stop()
        try manager.delete(id)

        // For now, return empty output - we'll add proper output capture later
        return (stdout: "", stderr: "", exitCode: exitStatus.exitCode)
    }

    /// Stop a container
    func stop(id: String) async throws {
        guard let container = containers[id] else {
            throw RuntimeError.containerNotFound(id)
        }

        try await container.stop()

        if var manager = managers[id] {
            try manager.delete(id)
        }

        containers.removeValue(forKey: id)
        managers.removeValue(forKey: id)
    }

    /// List running containers
    func list() -> [String] {
        Array(containers.keys)
    }
}

enum RuntimeError: LocalizedError {
    case containerNotFound(String)
    case invalidCommand
    case missingArgument(String)

    var errorDescription: String? {
        switch self {
        case .containerNotFound(let id):
            return "Container not found: \(id)"
        case .invalidCommand:
            return "Invalid command"
        case .missingArgument(let arg):
            return "Missing required argument: \(arg)"
        }
    }
}

// MARK: - CLI

@main
struct FabricContainerCLI {

    static let defaultKernelPath = {
        // Get directory containing the executable
        let executableURL = URL(fileURLWithPath: CommandLine.arguments[0]).resolvingSymlinksInPath()
        let executableDir = executableURL.deletingLastPathComponent()

        // Look for kernel in standard locations (ordered by preference)
        let possiblePaths = [
            // Sibling to executable (for installed binaries)
            executableDir.appendingPathComponent("vmlinux").path,
            // Up from .build/release to package's bin/ directory
            executableDir
                .deletingLastPathComponent()  // release
                .deletingLastPathComponent()  // .build
                .deletingLastPathComponent()  // FabricContainer
                .appendingPathComponent("bin/vmlinux").path,
            // System locations
            "/usr/local/share/fabric/vmlinux",
            NSHomeDirectory() + "/.fabric/vmlinux"
        ]
        return possiblePaths.first { FileManager.default.fileExists(atPath: $0) } ?? possiblePaths[0]
    }()

    static func main() async {
        let args = Array(CommandLine.arguments.dropFirst())

        guard let commandStr = args.first else {
            printUsage()
            return
        }

        do {
            switch commandStr {
            case "help", "--help", "-h":
                printUsage()

            case "run":
                try await runCommand(args: Array(args.dropFirst()))

            case "status":
                printStatus()

            case "list":
                print("[]")

            default:
                print("Unknown command: \(commandStr)")
                printUsage()
            }
        } catch {
            print("Error: \(error)")
            print("Localized: \(error.localizedDescription)")
            if let underlying = (error as NSError).userInfo[NSUnderlyingErrorKey] as? Error {
                print("Underlying: \(underlying)")
            }
            exit(1)
        }
    }

    /// Normalize image reference to fully-qualified form
    static func normalizeImageRef(_ ref: String) -> String {
        // If already has a domain (contains .), return as-is
        if ref.contains(".") {
            return ref
        }
        // If it's a simple name like "alpine:latest", prepend docker.io/library/
        let parts = ref.split(separator: "/")
        if parts.count == 1 {
            return "docker.io/library/\(ref)"
        }
        // If it's like "oven/bun:latest", prepend docker.io/
        return "docker.io/\(ref)"
    }

    static func runCommand(args: [String]) async throws {
        // Parse arguments
        var image = "docker.io/library/alpine:latest"
        var command: [String] = ["/bin/sh", "-c", "echo hello"]
        var kernelPath = defaultKernelPath

        var i = 0
        while i < args.count {
            switch args[i] {
            case "--image", "-i":
                i += 1
                if i < args.count { image = normalizeImageRef(args[i]) }
            case "--cmd", "-c":
                i += 1
                if i < args.count {
                    command = ["/bin/sh", "-c", args[i]]
                }
            case "--kernel", "-k":
                i += 1
                if i < args.count { kernelPath = args[i] }
            default:
                break
            }
            i += 1
        }

        // Verify kernel exists
        guard FileManager.default.fileExists(atPath: kernelPath) else {
            print("Error: Kernel not found at \(kernelPath)")
            print("Please run the setup script or specify --kernel path")
            exit(1)
        }

        let runtime = ContainerRuntime(config: .init(kernelPath: kernelPath))
        let id = UUID().uuidString

        print("Starting container with image: \(image)")
        print("Command: \(command.joined(separator: " "))")

        let result = try await runtime.run(
            id: id,
            image: image,
            command: command
        )

        print("Exit code: \(result.exitCode)")
    }

    static func printStatus() {
        let status: [String: Any] = [
            "status": "ready",
            "kernelPath": defaultKernelPath,
            "kernelExists": FileManager.default.fileExists(atPath: defaultKernelPath)
        ]

        if let data = try? JSONSerialization.data(withJSONObject: status, options: .prettyPrinted),
           let json = String(data: data, encoding: .utf8) {
            print(json)
        } else {
            print("{\"status\": \"ready\"}")
        }
    }

    static func printUsage() {
        print("""
        FabricContainer - Local container runtime

        Usage: fabric-container <command> [options]

        Commands:
            run     Run a container
            status  Get runtime status
            list    List running containers
            help    Show this help

        Run Options:
            --image, -i    Container image (default: alpine:latest)
            --cmd, -c      Command to run
            --kernel, -k   Path to Linux kernel

        Examples:
            fabric-container run --image alpine:latest --cmd "echo hello"
            fabric-container status
        """)
    }
}
