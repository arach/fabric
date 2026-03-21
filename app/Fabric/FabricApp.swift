import SwiftUI

@main
struct FabricApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var delegate

    var body: some Scene {
        Window("fabrun", id: "settings") {
            SettingsView()
                .environmentObject(delegate.monitor)
        }
        .windowStyle(.titleBar)
        .defaultSize(width: 480, height: 420)
    }
}
