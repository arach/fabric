// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "FabricApp",
    platforms: [
        .macOS(.v14)
    ],
    targets: [
        .executableTarget(
            name: "Fabric",
            path: "Fabric"
        )
    ]
)
