import * as vscode from 'vscode';
import { Schemas } from '@saxoflow/protocol';
import * as yaml from 'yaml';

const collection = vscode.languages.createDiagnosticCollection('saxoflow');

export function activateDiagnostics(context: vscode.ExtensionContext) {
  context.subscriptions.push(collection);

  vscode.workspace.onDidSaveTextDocument((doc) => {
    if (doc.fileName.endsWith('SaxoFlow.project.yaml')) validate(doc);
  });

  // validate if already open
  for (const d of vscode.workspace.textDocuments) {
    if (d.fileName.endsWith('SaxoFlow.project.yaml')) validate(d);
  }
}

function validate(doc: vscode.TextDocument) {
  const uri = doc.uri;
  const text = doc.getText();
  try {
    const parsed = yaml.parse(text);
    Schemas.ProjectSchema.parse(parsed);
    collection.set(uri, []); // clear errors
  } catch (e: any) {
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 1),
      `Project config invalid: ${e.message}`,
      vscode.DiagnosticSeverity.Error
    );
    collection.set(uri, [diagnostic]);
  }
}
