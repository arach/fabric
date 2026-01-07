//
//  FabricContainer
//
//  Local container runtime using Apple's Containerization framework
//  Provides CLI and HTTP API (Unix socket) for the TypeScript runtime-local adapter
//

import Foundation
import Containerization
import ContainerizationOS
import NIOCore
import NIOPosix
import NIOHTTP1

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

    /// Mount specification: host path -> container path
    struct MountSpec: Sendable {
        var source: String      // Host path
        var destination: String // Container path
        var readOnly: Bool = false
    }

    /// Run a new container and execute a command
    func run(
        id: String,
        image: String,
        command: [String],
        workdir: String = "/",
        env: [String: String] = [:],
        mounts: [MountSpec] = []
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

        // Build mount configurations
        var containerMounts: [Containerization.Mount] = []
        for mount in mounts {
            let options = mount.readOnly ? ["ro"] : []
            containerMounts.append(
                Containerization.Mount.share(source: mount.source, destination: mount.destination, options: options)
            )
        }

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

            // Add mounts
            for mount in containerMounts {
                containerConfig.mounts.append(mount)
            }
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

    /// Start a long-running container (like a server) without waiting for completion
    /// Returns the container's IP address for host access
    func start(
        id: String,
        image: String,
        command: [String],
        workdir: String = "/",
        env: [String: String] = [:],
        mounts: [MountSpec] = []
    ) async throws -> (containerId: String, ipAddress: String) {

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

        // Build mount configurations
        var containerMounts: [Containerization.Mount] = []
        for mount in mounts {
            let options = mount.readOnly ? ["ro"] : []
            containerMounts.append(
                Containerization.Mount.share(source: mount.source, destination: mount.destination, options: options)
            )
        }

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

            // Add mounts
            for mount in containerMounts {
                containerConfig.mounts.append(mount)
            }
        }

        try await container.create()
        try await container.start()

        // Store for later cleanup
        managers[id] = manager
        containers[id] = container

        // Get IP from the container's first network interface
        let ipAddress = container.config.interfaces.first.map { iface -> String in
            // The interface should be a VmnetNetwork.Interface with ipv4Address
            if let vmnetInterface = iface as? ContainerManager.VmnetNetwork.Interface {
                return vmnetInterface.ipv4Address.address.description
            }
            return "unknown"
        } ?? "unknown"

        return (containerId: id, ipAddress: ipAddress)
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

// MARK: - HTTP Server

/// HTTP handler for the container API
final class HTTPHandler: ChannelInboundHandler, @unchecked Sendable {
    typealias InboundIn = HTTPServerRequestPart
    typealias OutboundOut = HTTPServerResponsePart

    private let runtime: ContainerRuntime
    private let kernelPath: String

    private var requestHead: HTTPRequestHead?
    private var bodyBuffer: ByteBuffer?

    init(runtime: ContainerRuntime, kernelPath: String) {
        self.runtime = runtime
        self.kernelPath = kernelPath
    }

    func channelRead(context: ChannelHandlerContext, data: NIOAny) {
        let part = unwrapInboundIn(data)

        switch part {
        case .head(let head):
            requestHead = head
            bodyBuffer = context.channel.allocator.buffer(capacity: 0)

        case .body(var buffer):
            bodyBuffer?.writeBuffer(&buffer)

        case .end:
            guard let head = requestHead else { return }
            var localBuffer = bodyBuffer
            let body: String?
            if let length = localBuffer?.readableBytes {
                body = localBuffer?.readString(length: length)
            } else {
                body = nil
            }

            // Handle request asynchronously
            let promise = context.eventLoop.makePromise(of: Void.self)
            promise.completeWithTask {
                await self.handleRequest(context: context, head: head, body: body)
            }
        }
    }

    private func handleRequest(context: ChannelHandlerContext, head: HTTPRequestHead, body: String?) async {
        let path = head.uri.split(separator: "?").first.map(String.init) ?? head.uri
        let method = head.method

        do {
            switch (method, path) {
            case (.GET, "/status"):
                let response: [String: Any] = [
                    "status": "ready",
                    "kernelPath": kernelPath,
                    "kernelExists": FileManager.default.fileExists(atPath: kernelPath)
                ]
                sendJSON(context: context, status: .ok, body: response)

            case (.GET, "/list"):
                let containers = await runtime.list()
                sendJSON(context: context, status: .ok, body: ["containers": containers])

            case (.POST, "/run"):
                guard let body = body,
                      let data = body.data(using: .utf8),
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                    sendJSON(context: context, status: .badRequest, body: ["error": "Invalid JSON body"])
                    return
                }

                let imageRaw = json["image"] as? String ?? "alpine:latest"
                let image = normalizeImageRef(imageRaw)
                let cmd = json["command"] as? String ?? "echo hello"
                let command = ["/bin/sh", "-c", cmd]
                let id = json["id"] as? String ?? UUID().uuidString
                let workdir = json["workdir"] as? String ?? "/"

                // Parse mounts: [{ "source": "/host/path", "destination": "/container/path", "readOnly": false }]
                var mounts: [ContainerRuntime.MountSpec] = []
                if let mountsJson = json["mounts"] as? [[String: Any]] {
                    for mountJson in mountsJson {
                        if let source = mountJson["source"] as? String,
                           let destination = mountJson["destination"] as? String {
                            let readOnly = mountJson["readOnly"] as? Bool ?? false
                            mounts.append(ContainerRuntime.MountSpec(
                                source: source,
                                destination: destination,
                                readOnly: readOnly
                            ))
                        }
                    }
                }

                let result = try await runtime.run(
                    id: id,
                    image: image,
                    command: command,
                    workdir: workdir,
                    mounts: mounts
                )

                sendJSON(context: context, status: .ok, body: [
                    "id": id,
                    "exitCode": result.exitCode,
                    "stdout": result.stdout,
                    "stderr": result.stderr
                ])

            case (.POST, "/start"):
                // Start a long-running container (returns IP for host access)
                guard let body = body,
                      let data = body.data(using: .utf8),
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                    sendJSON(context: context, status: .badRequest, body: ["error": "Invalid JSON body"])
                    return
                }

                let imageRaw = json["image"] as? String ?? "oven/bun:latest"
                let image = normalizeImageRef(imageRaw)
                let cmd = json["command"] as? String ?? "echo running"
                let command = ["/bin/sh", "-c", cmd]
                let id = json["id"] as? String ?? UUID().uuidString
                let workdir = json["workdir"] as? String ?? "/"

                // Parse mounts
                var mounts: [ContainerRuntime.MountSpec] = []
                if let mountsJson = json["mounts"] as? [[String: Any]] {
                    for mountJson in mountsJson {
                        if let source = mountJson["source"] as? String,
                           let destination = mountJson["destination"] as? String {
                            let readOnly = mountJson["readOnly"] as? Bool ?? false
                            mounts.append(ContainerRuntime.MountSpec(
                                source: source,
                                destination: destination,
                                readOnly: readOnly
                            ))
                        }
                    }
                }

                let result = try await runtime.start(
                    id: id,
                    image: image,
                    command: command,
                    workdir: workdir,
                    mounts: mounts
                )

                sendJSON(context: context, status: .ok, body: [
                    "id": result.containerId,
                    "ipAddress": result.ipAddress,
                    "status": "running"
                ])

            case (.POST, _) where path.hasPrefix("/stop/"):
                let id = String(path.dropFirst("/stop/".count))
                try await runtime.stop(id: id)
                sendJSON(context: context, status: .ok, body: ["success": true])

            case (.POST, _) where path.hasPrefix("/snapshot/"):
                // Capture workspace files from a running container
                // Files are on the host (via mounts), so we read from the mount source
                guard let body = body,
                      let data = body.data(using: .utf8),
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                    sendJSON(context: context, status: .badRequest, body: ["error": "Invalid JSON body"])
                    return
                }

                let containerId = String(path.dropFirst("/snapshot/".count))
                let workspacePath = json["workspacePath"] as? String ?? ""

                guard !workspacePath.isEmpty else {
                    sendJSON(context: context, status: .badRequest, body: ["error": "workspacePath required"])
                    return
                }

                // Read files from workspace
                let fileManager = FileManager.default
                var files: [[String: Any]] = []

                if let enumerator = fileManager.enumerator(atPath: workspacePath) {
                    while let relativePath = enumerator.nextObject() as? String {
                        let fullPath = (workspacePath as NSString).appendingPathComponent(relativePath)
                        var isDir: ObjCBool = false

                        if fileManager.fileExists(atPath: fullPath, isDirectory: &isDir) && !isDir.boolValue {
                            // Only include files, not directories
                            if let data = fileManager.contents(atPath: fullPath) {
                                let base64 = data.base64EncodedString()
                                files.append([
                                    "path": relativePath,
                                    "content": base64,
                                    "encoding": "base64"
                                ])
                            }
                        }
                    }
                }

                let snapshot: [String: Any] = [
                    "containerId": containerId,
                    "timestamp": ISO8601DateFormatter().string(from: Date()),
                    "workspacePath": workspacePath,
                    "files": files
                ]

                sendJSON(context: context, status: .ok, body: snapshot)

            case (.POST, _) where path.hasPrefix("/restore/"):
                // Restore workspace files to a directory
                // Used to restore a snapshot to a new container's workspace
                guard let body = body,
                      let data = body.data(using: .utf8),
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                    sendJSON(context: context, status: .badRequest, body: ["error": "Invalid JSON body"])
                    return
                }

                let containerId = String(path.dropFirst("/restore/".count))
                let workspacePath = json["workspacePath"] as? String ?? ""
                let files = json["files"] as? [[String: Any]] ?? []

                guard !workspacePath.isEmpty else {
                    sendJSON(context: context, status: .badRequest, body: ["error": "workspacePath required"])
                    return
                }

                let fileManager = FileManager.default
                var restoredFiles: [String] = []
                var errors: [String] = []

                // Create workspace directory if needed
                try? fileManager.createDirectory(atPath: workspacePath, withIntermediateDirectories: true)

                for file in files {
                    guard let relativePath = file["path"] as? String,
                          let content = file["content"] as? String,
                          let encoding = file["encoding"] as? String else {
                        continue
                    }

                    let fullPath = (workspacePath as NSString).appendingPathComponent(relativePath)
                    let parentDir = (fullPath as NSString).deletingLastPathComponent

                    // Create parent directories
                    try? fileManager.createDirectory(atPath: parentDir, withIntermediateDirectories: true)

                    // Decode and write file
                    if encoding == "base64", let data = Data(base64Encoded: content) {
                        if fileManager.createFile(atPath: fullPath, contents: data) {
                            restoredFiles.append(relativePath)
                        } else {
                            errors.append("Failed to write: \(relativePath)")
                        }
                    } else if encoding == "utf8" {
                        if fileManager.createFile(atPath: fullPath, contents: content.data(using: .utf8)) {
                            restoredFiles.append(relativePath)
                        } else {
                            errors.append("Failed to write: \(relativePath)")
                        }
                    }
                }

                sendJSON(context: context, status: .ok, body: [
                    "containerId": containerId,
                    "workspacePath": workspacePath,
                    "restoredFiles": restoredFiles,
                    "errors": errors
                ])

            default:
                sendJSON(context: context, status: .notFound, body: ["error": "Not found"])
            }
        } catch {
            sendJSON(context: context, status: .internalServerError, body: [
                "error": error.localizedDescription
            ])
        }
    }

    private func normalizeImageRef(_ ref: String) -> String {
        if ref.contains(".") { return ref }
        let parts = ref.split(separator: "/")
        if parts.count == 1 {
            return "docker.io/library/\(ref)"
        }
        return "docker.io/\(ref)"
    }

    private func sendJSON(context: ChannelHandlerContext, status: HTTPResponseStatus, body: [String: Any]) {
        let data = (try? JSONSerialization.data(withJSONObject: body, options: [])) ?? Data()
        let buffer = context.channel.allocator.buffer(bytes: data)

        var headers = HTTPHeaders()
        headers.add(name: "Content-Type", value: "application/json")
        headers.add(name: "Content-Length", value: "\(data.count)")

        let head = HTTPResponseHead(version: .http1_1, status: status, headers: headers)
        context.write(wrapOutboundOut(.head(head)), promise: nil)
        context.write(wrapOutboundOut(.body(.byteBuffer(buffer))), promise: nil)
        context.writeAndFlush(wrapOutboundOut(.end(nil)), promise: nil)
    }
}

/// HTTP Server that listens on a Unix socket
actor HTTPServer {
    private let socketPath: String
    private let runtime: ContainerRuntime
    private let kernelPath: String
    private var channel: Channel?

    init(socketPath: String, runtime: ContainerRuntime, kernelPath: String) {
        self.socketPath = socketPath
        self.runtime = runtime
        self.kernelPath = kernelPath
    }

    func start() async throws {
        // Remove existing socket file
        try? FileManager.default.removeItem(atPath: socketPath)

        let group = MultiThreadedEventLoopGroup(numberOfThreads: System.coreCount)
        let runtimeCopy = runtime
        let kernelPathCopy = kernelPath

        let bootstrap = ServerBootstrap(group: group)
            .serverChannelOption(.socketOption(.so_reuseaddr), value: 1)
            .childChannelInitializer { channel in
                channel.pipeline.configureHTTPServerPipeline().flatMap {
                    channel.pipeline.addHandler(HTTPHandler(runtime: runtimeCopy, kernelPath: kernelPathCopy))
                }
            }

        channel = try await bootstrap.bind(unixDomainSocketPath: socketPath).get()
        print("HTTP server listening on \(socketPath)")

        // Wait forever
        try await channel?.closeFuture.get()
    }

    func stop() async {
        try? await channel?.close()
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

            case "serve":
                try await serveCommand(args: Array(args.dropFirst()))

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

    static func serveCommand(args: [String]) async throws {
        var socketPath = "/tmp/fabric-container.sock"
        var kernelPath = defaultKernelPath

        var i = 0
        while i < args.count {
            switch args[i] {
            case "--socket", "-s":
                i += 1
                if i < args.count { socketPath = args[i] }
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
        let server = HTTPServer(socketPath: socketPath, runtime: runtime, kernelPath: kernelPath)

        print("Starting HTTP server...")
        print("Socket: \(socketPath)")
        print("Kernel: \(kernelPath)")

        try await server.start()
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
            run     Run a container (one-shot)
            serve   Start HTTP API server on Unix socket
            status  Get runtime status
            list    List running containers
            help    Show this help

        Run Options:
            --image, -i    Container image (default: alpine:latest)
            --cmd, -c      Command to run
            --kernel, -k   Path to Linux kernel

        Serve Options:
            --socket, -s   Unix socket path (default: /tmp/fabric-container.sock)
            --kernel, -k   Path to Linux kernel

        Examples:
            fabric-container run --image alpine:latest --cmd "echo hello"
            fabric-container serve --socket /tmp/fabric.sock
            fabric-container status
        """)
    }
}
