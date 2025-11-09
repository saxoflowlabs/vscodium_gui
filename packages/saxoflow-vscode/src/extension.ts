import * as vscode from 'vscode';
import * as path from 'path';
import { runNewProjectWizard } from './newProjectWizard';
import { ProjectTreeProvider } from './projectTree';
import { activateDiagnostics } from './diagnostics';

/* ---------------------- Activate / Deactivate ---------------------- */
export function activate(context: vscode.ExtensionContext) {
   console.log('[SaxoFlow] activate() called');
  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('saxoflow.openDashboard', () => openDashboard()),
    vscode.commands.registerCommand('saxoflow.openToolShell', () => openToolShell()),
    vscode.commands.registerCommand('saxoflow.openHostShell', () => openHostShell()),
    vscode.commands.registerCommand('saxoflow.newProject', () => runNewProjectWizard(context)),
    vscode.commands.registerCommand('saxoflow.quickActions', () => quickActions())
  );

  // Status bar with quick actions
  const sb = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  sb.text = '$(rocket) SaxoFlow';
  sb.tooltip = 'SaxoFlow — Quick Actions';
  sb.command = 'saxoflow.quickActions';
  sb.show();
  context.subscriptions.push(sb);

  // Project tree
  const tree = new ProjectTreeProvider();
  vscode.window.registerTreeDataProvider('saxoflowProjectView', tree);
  context.subscriptions.push(vscode.commands.registerCommand('saxoflow.refreshProject', () => tree.refresh()));

  // Diagnostics (validate SaxoFlow.project.yaml)
  activateDiagnostics(context);
}

export function deactivate() {}

/* ---------------------- Quick Actions ---------------------- */
async function quickActions() {
  const items: Array<vscode.QuickPickItem & { cmd: string }> = [
    { label: '$(rocket) Open Dashboard', description: 'Main SaxoFlow panel', cmd: 'saxoflow.openDashboard' },
    { label: '$(terminal) Open Host Shell', description: 'Local tools', cmd: 'saxoflow.openHostShell' },
    { label: '$(terminal) Open Tool Shell (Docker)', description: 'Workspace mounted at /ws', cmd: 'saxoflow.openToolShell' },
    { label: '$(new-file) New Project (Wizard)', description: 'Create SaxoFlow.project.yaml & folders', cmd: 'saxoflow.newProject' }
  ];
  const choice = await vscode.window.showQuickPick(items, { placeHolder: 'SaxoFlow — choose an action' });
  if (choice) await vscode.commands.executeCommand(choice.cmd);
}

/* ---------------------- Dashboard ---------------------- */
function openDashboard() {
  const panel = vscode.window.createWebviewPanel(
    'saxoflowDashboard', 'SaxoFlow Dashboard', vscode.ViewColumn.One, { enableScripts: true }
  );
  panel.webview.html = `
  <!doctype html><html><head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SaxoFlow Dashboard</title>
  </head><body>
    <h2>🚀 SaxoFlow</h2>
    <p>Use the status bar or Command Palette to open Host/Tool Shells or create a new project.</p>
  </body></html>`;
}

/* ---------------------- Host Shell ---------------------- */
function openHostShell() {
  const term = vscode.window.createTerminal({ name: 'SaxoFlow Host Shell' });
  term.show();
  term.sendText('echo "SaxoFlow Host Shell"');
}

/* ---------------------- Tool Shell (Docker) ---------------------- */
async function openToolShell() {
  const wf = vscode.workspace.workspaceFolders?.[0];
  if (!wf) {
    vscode.window.showErrorMessage('Open a workspace folder before starting the Tool Shell.');
    return;
  }
  const workspacePath = path.normalize(wf.uri.fsPath);

  const cfg = vscode.workspace.getConfiguration();
  const pdkFromCfg = (cfg.get<string>('saxoflow.pdkRoot') || '').trim();
  const pdkFromEnv = process.env.PDK_ROOT || '';
  const pdkRoot = pdkFromCfg || pdkFromEnv;

  if (!pdkRoot) {
    vscode.window.showWarningMessage('PDK root is not set. Configure Settings: "SaxoFlow › Pdk Root" or define PDK_ROOT.');
  }

  const toolImage = (cfg.get<string>('saxoflow.toolImage') || 'ghcr.io/theopenroadproject/openroad:latest').trim();

  const WS_MOUNT = '/ws';
  const PDK_MOUNT = '/pdk';

  const dockerCmd = buildDockerRun(toolImage, workspacePath, pdkRoot || undefined, WS_MOUNT, PDK_MOUNT);

  const term = vscode.window.createTerminal({ name: 'SaxoFlow Tool Shell', env: { PDK_ROOT: pdkRoot } });
  term.show();
  term.sendText(dockerCmd);
}

/* ---------------------- helpers ---------------------- */
function q(p: string): string { return p ? `"${p.replace(/"/g, '\\"')}"` : '""'; }

function buildDockerRun(
  image: string, workspaceHostPath: string, pdkHostPath: string | undefined, wsMount: string, pdkMount: string
): string {
  const args: string[] = ['docker', 'run', '--rm', '-it'];

  // mounts
  args.push('-v', `${workspaceHostPath}:${wsMount}`);
  if (pdkHostPath && pdkHostPath.length > 0) {
    args.push('-v', `${pdkHostPath}:${pdkMount}`, '-e', `PDK_ROOT=${pdkMount}`);
  }

  // workdir + image + shell
  args.push('-w', wsMount, image, 'bash', '-l');

  // quote path args for safety
  return args.map((x, i) => {
    if (i > 0 && (args[i - 1] === '-v' || args[i - 1] === '-w')) return q(x);
    return x;
  }).join(' ');
}
