import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var monitor: RunnerMonitor

    var body: some View {
        TabView {
            GeneralTab()
                .tabItem { Label("General", systemImage: "gearshape") }

            APITab()
                .tabItem { Label("API", systemImage: "network") }

            AboutTab()
                .tabItem { Label("About", systemImage: "info.circle") }
        }
        .frame(minWidth: 420, minHeight: 340)
    }
}

// MARK: - General Tab

struct GeneralTab: View {
    @EnvironmentObject var monitor: RunnerMonitor

    var body: some View {
        Form {
            Section {
                LabeledContent("Container System") {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(monitor.isRunning ? .green : .red)
                            .frame(width: 8, height: 8)
                        Text(monitor.isRunning ? "Running" : "Stopped")
                            .foregroundStyle(monitor.isRunning ? .primary : .secondary)
                    }
                }

                LabeledContent("Builder") {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(monitor.builderReady ? .green : .red)
                            .frame(width: 8, height: 8)
                        Text(monitor.builderReady ? "Ready" : "Not ready")
                            .foregroundStyle(monitor.builderReady ? .primary : .secondary)
                    }
                }

                LabeledContent("Runner Home") {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(monitor.runnerHomeExists ? .green : .orange)
                            .frame(width: 8, height: 8)
                        Text(monitor.runnerHomeExists ? "~/.fabric-runner" : "Not created")
                            .font(.system(.body, design: .monospaced))
                            .foregroundStyle(monitor.runnerHomeExists ? .primary : .secondary)
                    }
                }
            } header: {
                Text("Runtime Status")
            }

            Section {
                HStack {
                    Button("Bootstrap Runtime") {
                        Task {
                            await RunnerBootstrap.run()
                            try? await Task.sleep(for: .seconds(2))
                            monitor.checkNow()
                        }
                    }

                    Button("Check Status") {
                        monitor.checkNow()
                    }
                }
            } header: {
                Text("Actions")
            }
        }
        .formStyle(.grouped)
    }
}

// MARK: - API Tab

struct APITab: View {
    var body: some View {
        Form {
            Section {
                LabeledContent("Status") {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(.green)
                            .frame(width: 8, height: 8)
                        Text("Listening")
                    }
                }

                LabeledContent("Port") {
                    Text("\(RunnerAPI.defaultPort)")
                        .monospacedDigit()
                }

                LabeledContent("Address") {
                    Text("http://127.0.0.1:\(RunnerAPI.defaultPort)")
                        .font(.system(.body, design: .monospaced))
                        .textSelection(.enabled)
                }
            } header: {
                Text("Runner API")
            }

            Section {
                Text("Linia and other clients can invoke Fabric Runner via HTTP. Send a script URL and parameters to run tasks in Apple containers.")
                    .font(.callout)
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 8) {
                    EndpointRow(method: "GET", path: "/health", desc: "Runtime status")
                    EndpointRow(method: "POST", path: "/run", desc: "Run a script")
                    EndpointRow(method: "GET", path: "/jobs/{id}", desc: "Job status")
                }
                .padding(.vertical, 2)
            } header: {
                Text("Endpoints")
            }
        }
        .formStyle(.grouped)
    }
}

struct EndpointRow: View {
    let method: String
    let path: String
    let desc: String

    var body: some View {
        HStack(spacing: 8) {
            Text(method)
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(method == "POST" ? Color.blue.opacity(0.15) : Color.green.opacity(0.15))
                .cornerRadius(4)
                .foregroundStyle(method == "POST" ? .blue : .green)

            Text(path)
                .font(.system(.body, design: .monospaced))

            Spacer()

            Text(desc)
                .font(.callout)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - About Tab

struct AboutTab: View {
    var body: some View {
        Form {
            Section {
                LabeledContent("Version") {
                    Text(FabricVersion.current)
                }

                LabeledContent("Runtime") {
                    Text("macOS \(ProcessInfo.processInfo.operatingSystemVersionString)")
                }

                LabeledContent("Data") {
                    Text("~/.fabric-runner/")
                        .font(.system(.body, design: .monospaced))
                }
            } header: {
                Text("Fabric Runner")
            }

            Section {
                Text("Fabric Runner is a local-first compute substrate for macOS. It manages Apple containers and exposes a simple HTTP API for running cookbook-driven tasks from Linia and other clients.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } header: {
                Text("About")
            }
        }
        .formStyle(.grouped)
    }
}
