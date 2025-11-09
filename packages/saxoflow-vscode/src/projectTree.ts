import * as vscode from 'vscode';
import * as yaml from 'yaml';

type Node = { label: string; resource?: vscode.Uri; collapsible?: vscode.TreeItemCollapsibleState };

/** Project tree provider exported as a module symbol (so TS treats this file as a module). */
export class ProjectTreeProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh() { this._onDidChangeTreeData.fire(); }

  getTreeItem(e: Node): vscode.TreeItem {
    const item = new vscode.TreeItem(e.label, e.collapsible ?? vscode.TreeItemCollapsibleState.None);
    if (e.resource) {
      item.resourceUri = e.resource;
      item.command = { command: 'vscode.open', title: 'Open', arguments: [e.resource] };
      item.contextValue = 'file';
    }
    return item;
  }

  async getChildren(e?: Node): Promise<Node[]> {
    const wf = vscode.workspace.workspaceFolders?.[0];
    if (!wf) return [{ label: 'Open a workspace folder…' }];

    if (!e) {
      return [
        { label: 'Config',        collapsible: vscode.TreeItemCollapsibleState.Expanded },
        { label: 'RTL',           collapsible: vscode.TreeItemCollapsibleState.Collapsed },
        { label: 'Testbenches',   collapsible: vscode.TreeItemCollapsibleState.Collapsed },
        { label: 'Constraints',   collapsible: vscode.TreeItemCollapsibleState.Collapsed },
        { label: 'Build',         collapsible: vscode.TreeItemCollapsibleState.Collapsed }
      ];
    }

    // read config if present
    const projUri = vscode.Uri.joinPath(wf.uri, 'SaxoFlow.project.yaml');
    let cfg: any = undefined;
    try {
      const txt = await vscode.workspace.fs.readFile(projUri);
      cfg = yaml.parse(Buffer.from(txt).toString('utf-8'));
    } catch { /* not found is fine */ }

    const bucket = e.label.toLowerCase();
    if (bucket === 'config') {
      return cfg ? [{ label: 'SaxoFlow.project.yaml', resource: projUri }] : [{ label: 'No config found' }];
    }

    const paths = cfg?.paths || { rtl: 'rtl/', tb: 'tb/', constraints: 'constraints/', build: '.saxoflow/build' };
    const map: Record<string,string> = {
      'rtl': paths.rtl,
      'testbenches': paths.tb || 'tb/',
      'constraints': paths.constraints || 'constraints/',
      'build': paths.build || '.saxoflow/build'
    };

    const folderRel = map[bucket];
    if (!folderRel) return [];
    const folderAbs = vscode.Uri.joinPath(wf.uri, folderRel);
    try {
      const entries = await vscode.workspace.fs.readDirectory(folderAbs);
      return entries.map(([name]) => ({ label: name, resource: vscode.Uri.joinPath(folderAbs, name) }));
    } catch {
      return [{ label: `Missing folder: ${folderRel}` }];
    }
  }
}

/* Force module-ness even if someone later removes the export by accident. */
export {};
