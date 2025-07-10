import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export async function createProject(): Promise<void> {
    const projectName = await vscode.window.showInputBox({
        prompt: 'Enter the name of your Linera project',
        placeHolder: 'my-linera-app',
        validateInput: value => {
            if (!value) {
                return 'Project name is required.';
            }
            if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) {
                return 'Invalid project name. Use lowercase letters, numbers, and hyphens.';
            }
            return null;
        }
    });

    if (!projectName) {
        return;
    }

    const uris = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: 'Select a parent folder for the project'
    });

    if (!uris || uris.length === 0) {
        return;
    }

    const parentDir = uris[0].fsPath;
    const projectPath = path.join(parentDir, projectName);

    if (fs.existsSync(projectPath)) {
        vscode.window.showErrorMessage(`Directory already exists: ${projectPath}`);
        return;
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Creating Linera project: ${projectName}`,
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 0, message: "Initializing..." });

        return new Promise<void>((resolve, reject) => {
            const command = `linera project new "${projectPath}"`;
            cp.exec(command, (err, stdout, stderr) => {
                if (err) {
                    vscode.window.showErrorMessage(`Error creating project: ${stderr}`);
                    console.error(err);
                    reject(err);
                    return;
                }

                progress.report({ increment: 100, message: "Done!" });
                vscode.window.showInformationMessage(`Successfully created Linera project: ${projectName}`);
                
                const openProjectButton = 'Open Project';
                vscode.window.showInformationMessage(`Project created at ${projectPath}`, openProjectButton).then(selection => {
                    if (selection === openProjectButton) {
                        const uri = vscode.Uri.file(projectPath);
                        vscode.commands.executeCommand('vscode.openFolder', uri);
                    }
                });
                resolve();
            });
        });
    });
}