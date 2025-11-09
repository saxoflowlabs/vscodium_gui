import * as vscode from 'vscode';
import * as yaml from 'yaml';

type WizardData = {
  name: string;
  top: string;
  language: 'verilog' | 'systemverilog';
  pdk: string;
  clockName: string;
  periodNs: number;
};

export async function runNewProjectWizard(_context: vscode.ExtensionContext) {
  const wf = vscode.workspace.workspaceFolders?.[0];
  if (!wf) {
    vscode.window.showErrorMessage('Open a workspace folder before creating a project.');
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'saxoflowNewProject',
    'SaxoFlow — New Project',
    vscode.ViewColumn.Active,
    { enableScripts: true }
  );

  panel.webview.html = html();

  const disposable = panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg?.type === 'submit') {
      const d: WizardData = msg.data;
      await generateProject(wf.uri, d);
      vscode.window.showInformationMessage(`SaxoFlow project "${d.name}" created.`);
      panel.dispose();
    } else if (msg?.type === 'cancel') {
      panel.dispose();
    }
  });

  panel.onDidDispose(() => disposable.dispose());
}

async function generateProject(root: vscode.Uri, d: WizardData) {
  // Create folders
  const rtl = vscode.Uri.joinPath(root, 'rtl');
  const tb = vscode.Uri.joinPath(root, 'tb');
  const cons = vscode.Uri.joinPath(root, 'constraints');
  const build = vscode.Uri.joinPath(root, '.saxoflow', 'build');

  await vscode.workspace.fs.createDirectory(rtl);
  await vscode.workspace.fs.createDirectory(tb);
  await vscode.workspace.fs.createDirectory(cons);
  await vscode.workspace.fs.createDirectory(build);

  // RTL top
  const topFile = vscode.Uri.joinPath(rtl, `${d.top}.sv`);
  const topSrc =
`module ${d.top} (
  input  logic ${d.clockName}
);
  // TODO: your design here
endmodule
`;
  await vscode.workspace.fs.writeFile(topFile, Buffer.from(topSrc, 'utf8'));

  // TB
  const tbFile = vscode.Uri.joinPath(tb, `${d.top}_tb.sv`);
  const tbSrc =
`module ${d.top}_tb;
  logic ${d.clockName} = 0;
  always #5 ${d.clockName} = ~${d.clockName};

  ${d.top} dut(.${d.clockName}(${d.clockName}));

  initial begin
    #100 $finish;
  end
endmodule
`;
  await vscode.workspace.fs.writeFile(tbFile, Buffer.from(tbSrc, 'utf8'));

  // Project YAML
  const proj = {
    project: {
      name: d.name,
      top: d.top,
      language: d.language,
      pdk: d.pdk,
      clock: { name: d.clockName, period_ns: d.periodNs }
    },
    paths: { rtl: 'rtl/', tb: 'tb/', constraints: 'constraints/', build: '.saxoflow/build' },
    flow: { profile: 'asic-sky130-default', stages: ['sim','formal','synth','floorplan','place','cts','route','sta','drc_lvs'] },
    ai: { enable: true, provider: 'env' }
  };

  const projYaml = yaml.stringify(proj);
  const projUri = vscode.Uri.joinPath(root, 'SaxoFlow.project.yaml');
  await vscode.workspace.fs.writeFile(projUri, Buffer.from(projYaml, 'utf8'));

  // Open config & refresh tree
  await vscode.window.showTextDocument(projUri, { preview: false });
  await vscode.commands.executeCommand('saxoflow.refreshProject');
}

function html(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SaxoFlow — New Project</title>
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 1rem; }
  input, select { width: 100%; padding: .4rem; margin: .3rem 0 .8rem; }
  button { padding: .5rem 1rem; }
</style>
</head>
<body>
  <h2>New SaxoFlow Project</h2>
  <label>Name <input id="name" placeholder="fp_adder"></label>
  <label>Top module <input id="top" placeholder="fpu_add_top"></label>
  <label>Language
    <select id="lang">
      <option value="systemverilog" selected>systemverilog</option>
      <option value="verilog">verilog</option>
    </select>
  </label>
  <label>PDK <input id="pdk" placeholder="sky130"></label>
  <label>Clock name <input id="clk" value="clk"></label>
  <label>Clock period (ns) <input id="period" type="number" value="10"></label>

  <div>
    <button id="create">Create</button>
    <button id="cancel">Cancel</button>
  </div>

<script>
  const vscode = acquireVsCodeApi();
  document.getElementById('create').addEventListener('click', () => {
    const data = {
      name: document.getElementById('name').value || 'fp_project',
      top: document.getElementById('top').value || 'top',
      language: document.getElementById('lang').value,
      pdk: document.getElementById('pdk').value || 'sky130',
      clockName: document.getElementById('clk').value || 'clk',
      periodNs: Number(document.getElementById('period').value) || 10
    };
    vscode.postMessage({ type: 'submit', data });
  });
  document.getElementById('cancel').addEventListener('click', () => {
    vscode.postMessage({ type: 'cancel' });
  });
</script>
</body>
</html>`;
}
