import * as vscode from 'vscode';
import { createProject } from './commands/createProject';
import { LineraPanelViewProvider } from './webviews/projectView';

export function activate(context: vscode.ExtensionContext) {

    // Register the WebviewViewProvider
    const provider = new LineraPanelViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(LineraPanelViewProvider.viewType, provider));

    // Register the createProject command
    context.subscriptions.push(
        vscode.commands.registerCommand('linera-extension.createProject', createProject)
    );
}

export function deactivate() {}