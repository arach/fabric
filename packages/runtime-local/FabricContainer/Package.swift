// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "FabricContainer",
    platforms: [.macOS(.v26)],
    products: [
        .executable(name: "fabric-container", targets: ["FabricContainer"])
    ],
    dependencies: [
        .package(url: "https://github.com/apple/containerization.git", branch: "main"),
        .package(url: "https://github.com/apple/swift-nio.git", from: "2.65.0")
    ],
    targets: [
        .executableTarget(
            name: "FabricContainer",
            dependencies: [
                .product(name: "Containerization", package: "containerization"),
                .product(name: "ContainerizationOS", package: "containerization"),
                .product(name: "NIOCore", package: "swift-nio"),
                .product(name: "NIOPosix", package: "swift-nio"),
                .product(name: "NIOHTTP1", package: "swift-nio")
            ]
        )
    ]
)
