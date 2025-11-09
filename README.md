
# SaxoFlow VSCodium GUI — Monorepo (M0 Scaffold)

This is the initial scaffold for the SaxoFlow GUI extension and related packages.

## Quickstart
1) Install Node 18+ and pnpm
2) `pnpm install`
3) Open `packages/saxoflow-vscode` in VSCodium and press F5 (Launch Extension).

## Packages
- `packages/saxoflow-vscode` — VS Code/VSCodium extension
- `packages/saxoflow-protocol` — shared IPC types & JSON Schemas
- `packages/saxoflow-runner` — (future) bridge runner for CLI/process mgmt

---

## SaxoFlow VSCodium GUI — Quick Tour (M0)

### Commands
- **SaxoFlow: Open Dashboard** — opens the main webview
- **SaxoFlow: Open Host Shell** — native terminal (local tools)
- **SaxoFlow: Open Tool Shell** — Docker terminal, mounts the workspace at **/ws** (and PDK at **/pdk** if set)

### Settings
- **SaxoFlow › Pdk Root**: absolute path to your PDK directory  
  - Linux/WSL: `/home/you/pdk`  
  - macOS: `/Users/you/pdk`  
  - Windows: `C:\pdk`
- **SaxoFlow › Tool Image**: Docker image used for the Tool Shell  
  Default: `ghcr.io/theopenroadproject/openroad:latest`

### Status Bar
Click **“SaxoFlow”** (left side) for quick actions:
- 🚀 Open Dashboard
- 🖥️ Open Host Shell
- 🐳 Open Tool Shell (Docker)

### Screenshots
> Place your images in `docs/img/` and reference them here:
- Dashboard: `![Dashboard](docs/img/dashboard.png)`
- Quick Actions: `![QuickActions](docs/img/quick-actions.png)`
- Tool Shell: `![ToolShell](docs/img/tool-shell.png)`

### FAQ
**Q: The Tool Shell says Docker not found.**  
A: Install Docker Desktop (Windows/macOS) or docker-ce (Linux). Restart VS Code. Verify `docker run hello-world`.

**Q: PDK_ROOT isn’t set.**  
A: Set **Settings → SaxoFlow › Pdk Root** or define the `PDK_ROOT` environment variable before starting the editor.

**Q: On Windows, volume mount fails.**  
A: Ensure Docker Desktop has File Sharing enabled for the drive. If using WSL2, enable **WSL integration** for your distro and use Linux paths inside WSL.
