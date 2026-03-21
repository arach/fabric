import AppKit
import SwiftUI

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate, ObservableObject {
    private var statusItem: NSStatusItem!
    let monitor = RunnerMonitor()
    private var apiServer: RunnerAPI?

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupMenuBar()

        // Bootstrap on first launch
        if !UserDefaults.standard.bool(forKey: "hasCompletedOnboarding") {
            Task {
                await RunnerBootstrap.run()
                monitor.checkNow()
            }
            showSettings()
            UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
        }

        monitor.start()

        // Start HTTP API for Linia integration
        let server = RunnerAPI(monitor: monitor)
        server.start()
        apiServer = server
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        NSApp.setActivationPolicy(.accessory)
        return false
    }

    // MARK: - Menu bar

    private func setupMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)

        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "cube.fill", accessibilityDescription: "Fabric")
            button.image?.size = NSSize(width: 16, height: 16)
        }

        let menu = NSMenu()
        menu.addItem(withTitle: "fabrun v\(FabricVersion.current)", action: nil, keyEquivalent: "")
        menu.addItem(.separator())

        let statusMenuItem = NSMenuItem(title: "Checking...", action: nil, keyEquivalent: "")
        statusMenuItem.tag = 100
        menu.addItem(statusMenuItem)

        let apiMenuItem = NSMenuItem(title: "API: http://127.0.0.1:\(RunnerAPI.defaultPort)", action: nil, keyEquivalent: "")
        apiMenuItem.tag = 101
        menu.addItem(apiMenuItem)

        menu.addItem(.separator())
        menu.addItem(withTitle: "Open Settings...", action: #selector(showSettings), keyEquivalent: ",")
        menu.addItem(withTitle: "Restart Runtime", action: #selector(restartRuntime), keyEquivalent: "")
        menu.addItem(.separator())
        menu.addItem(withTitle: "Quit fabrun", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")

        statusItem.menu = menu

        Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.updateMenuBarState()
            }
        }
        updateMenuBarState()
    }

    private func updateMenuBarState() {
        guard let button = statusItem.button,
              let menu = statusItem.menu,
              let statusMenuItem = menu.item(withTag: 100)
        else { return }

        if monitor.isRunning {
            button.contentTintColor = .systemGreen
            statusMenuItem.title = "Runtime: Running"
        } else {
            button.contentTintColor = .systemRed
            statusMenuItem.title = "Runtime: Stopped"
        }
    }

    // MARK: - Actions

    @objc func showSettings() {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
        if let window = NSApp.windows.first(where: { $0.title == "fabrun" }) {
            window.makeKeyAndOrderFront(nil)
        }
    }

    @objc func restartRuntime() {
        Task {
            await RunnerBootstrap.run()
            try? await Task.sleep(for: .seconds(2))
            monitor.checkNow()
        }
    }

    // MARK: - URL Scheme

    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls {
            guard url.scheme == "fab" else { continue }
            switch url.host {
            case "settings":
                showSettings()
            case "restart":
                restartRuntime()
            default:
                showSettings()
            }
        }
    }
}
