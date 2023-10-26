import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
    vscode.commands.registerCommand('zede-jetbrains-helper.reveal', () =>
      vscode.commands.executeCommand('workbench.files.action.showActiveFileInExplorer')
    )
  );
}

export function deactivate() {}