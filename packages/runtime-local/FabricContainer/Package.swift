// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "FabricContainer",
    platforms: [.macOS(.v26)],
    products: [
        .executable(name: "fabric-container", targets: ["FabricContainer"])
    ],
    dependencies: [
        .package(url: "https://github.com/apple/containerization.git", branch: "main")
    ],
    targets: [
        .executableTarget(
            name: "FabricContainer",
            dependencies: [
                .product(name: "Containerization", package: "containerization"),
                .product(name: "ContainerizationOS", package: "containerization")
            ]
        )
    ]
)
