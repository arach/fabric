//
//  FabricContainer
//
//  Local container runtime using Apple's Virtualization.framework
//  Provides a CLI interface for the TypeScript runtime-local adapter
//

import Foundation
import Containerization
import ContainerizationOS

// MARK: - Commands

enum Command: String {
    case run        // Run a container
    case exec       // Execute command in running container
    case stop       // Stop a container
    case list       // List running containers
    case status     // Get container status
    case help
}

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

    /// Run a new container
    func run(
        id: String,
        image: String,
        command: [String],
        mounts: [(host: String, container: String)] = [],
        env: [String: String] = [:]
    ) async throws -> String {

        let kernel = try Kernel(
            path: URL(fileURLWithPath: config.kernelPath),
            platform: .linuxArm
        )

        let manager = try await ContainerManager(
            kernel: kernel,
            initfsReference: "ghcr.io/apple/containerization/vminit:0.13.0",
            network: try ContainerManager.VmnetNetwork()
        )

        let container = try await manager.create(
            id,
            reference: image,
            rootfsSizeInBytes: 2 * 1024 * 1024 * 1024  // 2 GiB
        ) { containerConfig in
            containerConfig.cpus = self.config.cpuCount
            containerConfig.memoryInBytes = UInt64(self.config.memoryMiB) * 1024 * 1024

            containerConfig.process.arguments = command
            containerConfig.process.workingDirectory = "/app"

            for (key, value) in env {
                containerConfig.process.environment[key] = value
            }
        }

        try await container.create()
        try await container.start()

        managers[id] = manager
        containers[id] = container

        return id
    }

    /// Stop a container
    func stop(id: String) async throws {
        guard let container = containers[id] else {
            throw RuntimeError.containerNotFound(id)
        }

        try await container.stop()

        if let manager = managers[id] {
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
    static func main() async {
        let args = CommandLine.arguments.dropFirst()

        guard let commandStr = args.first,
              let command = Command(rawValue: commandStr) else {
            printUsage()
            return
        }

        switch command {
        case .help:
            printUsage()

        case .run:
            print("fabric-container: run command")
            print("TODO: Implement container run")

        case .exec:
            print("fabric-container: exec command")
            print("TODO: Implement container exec")

        case .stop:
            print("fabric-container: stop command")
            print("TODO: Implement container stop")

        case .list:
            print("fabric-container: list command")
            print("[]")

        case .status:
            print("fabric-container: status command")
            print("{\"status\": \"ready\"}")
        }
    }

    static func printUsage() {
        print("""
        FabricContainer - Local container runtime

        Usage: fabric-container <command> [options]

        Commands:
            run     Run a container
            exec    Execute command in container
            stop    Stop a container
            list    List running containers
            status  Get runtime status
            help    Show this help

        Examples:
            fabric-container run --image oven/bun:latest --cmd "bun run server.ts"
            fabric-container stop container-id
            fabric-container list
        """)
    }
}
