import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {

    // Register the WebviewViewProvider
    const provider = new LineraPanelViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(LineraPanelViewProvider.viewType, provider));

    // Register the createProject command
    context.subscriptions.push(
        vscode.commands.registerCommand('linera-extension.createProject', async () => {
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

            vscode.window.withProgress({
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
        })
    );
}

export function deactivate() {}

class LineraPanelViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'linera.projectExplorer';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'getSettings':
                    {
                        const config = vscode.workspace.getConfiguration('linera');
                        const settings = {
                            modelUrl: config.get('modelUrl'),
                            apiToken: config.get('apiToken'),
                            projectsRoot: config.get('projectsRoot'),
                            modelName: config.get('modelName')
                        };
                        webviewView.webview.postMessage({ command: 'setSettings', settings });
                    }
                    break;
                case 'saveSettings':
                    {
                        const config = vscode.workspace.getConfiguration('linera');
                        await config.update('modelUrl', message.settings.modelUrl, vscode.ConfigurationTarget.Global);
                        await config.update('apiToken', message.settings.apiToken, vscode.ConfigurationTarget.Global);
                        await config.update('projectsRoot', message.settings.projectsRoot, vscode.ConfigurationTarget.Global);
                        await config.update('modelName', message.settings.modelName, vscode.ConfigurationTarget.Global);
                        vscode.window.showInformationMessage('Settings saved.');
                    }
                    break;
                case 'promptLLM':
                    {
                        const config = vscode.workspace.getConfiguration('linera');
                        const modelUrl = config.get<string>('modelUrl');
                        const apiToken = config.get<string>('apiToken');
                        const modelName = config.get<string>('modelName');

                        if (!modelUrl || !apiToken || !modelName) {
                            vscode.window.showErrorMessage('LLM settings are not configured. Please set them in the Settings tab.');
                            webviewView.webview.postMessage({ command: 'streamResponse', text: 'Error: LLM settings are not configured.' });
                            webviewView.webview.postMessage({ command: 'streamEnd' });
                            return;
                        }

                        try {
                            const response = await axios.post(
                                modelUrl,
                                {
                                    model: modelName,
                                    prompt: message.prompt,
                                    stream: true
                                },
                                {
                                    headers: {
                                        'Authorization': `Bearer ${apiToken}`,
                                        'Content-Type': 'application/json'
                                    },
                                    responseType: 'stream'
                                }
                            );

                            response.data.on('data', (chunk: Buffer) => {
                                const text = chunk.toString('utf-8');
                                webviewView.webview.postMessage({ command: 'streamResponse', text });
                            });

                            response.data.on('end', () => {
                                webviewView.webview.postMessage({ command: 'streamEnd' });
                            });

                        } catch (error) {
                            console.error(error);
                            let errorMessage = 'An unknown error occurred.';
                            if (axios.isAxiosError(error) && error.response) {
                                errorMessage = `Error from LLM: ${error.response.status} ${error.response.statusText}`;
                            } else if (error instanceof Error) {
                                errorMessage = error.message;
                            }
                            vscode.window.showErrorMessage(errorMessage);
                            webviewView.webview.postMessage({ command: 'streamResponse', text: `Error: ${errorMessage}` });
                            webviewView.webview.postMessage({ command: 'streamEnd' });
                        }
                    }
                    break;
            }
        });

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get path to main webview HTML
        const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Get path to craft page HTML
        const craftPagePath = path.join(this._extensionUri.fsPath, 'src', 'craft', 'page.html');
        const craftPageHtml = fs.readFileSync(craftPagePath, 'utf8');

        // Inject craft page content
        html = html.replace('<!-- CRAFT_CONTENT_PLACEHOLDER -->', craftPageHtml);

        // Get path to settings page HTML
        const settingsPagePath = path.join(this._extensionUri.fsPath, 'src', 'settings', 'page.html');
        const settingsPageHtml = fs.readFileSync(settingsPagePath, 'utf8');

        // Inject settings page content
        html = html.replace('<!-- SETTINGS_CONTENT_PLACEHOLDER -->', settingsPageHtml);

        // Since we've embedded the JavaScript code directly in the HTML file,
        // we no longer need to replace the script tag.
        // If we want to use external script files in the future, we can uncomment the following code:
        /*
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview.js'));
        html = html.replace(
            /<script src=".\/webview.js">\s*<\/script>/,
            `<script src="${scriptUri}"></script>`
        );
        */

        return html;
    }
}