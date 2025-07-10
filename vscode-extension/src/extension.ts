import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { createProject } from './commands/createProject';

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
                case 'craft-action':
                    {
                        // Handle craft actions
                        switch (message.action) {
                            case 'create-2048-game':
                                webviewView.webview.postMessage({ 
                                    command: 'setPrompt', 
                                    prompt: 'Create a 2048 game using Linera microchain technology.' 
                                });
                                break;
                            case 'create-counter-program':
                                webviewView.webview.postMessage({ 
                                    command: 'setPrompt', 
                                    prompt: 'Create a counter program using Linera microchain technology.' 
                                });
                                break;
                            case 'explain-project':
                                webviewView.webview.postMessage({ 
                                    command: 'setPrompt', 
                                    prompt: 'Explain how Linera microchain technology works and its benefits.' 
                                });
                                break;
                            case 'execute-project':
                                webviewView.webview.postMessage({ 
                                    command: 'setPrompt', 
                                    prompt: 'How do I execute and deploy a Linera microchain project?' 
                                });
                                break;
                            default:
                                console.log(`Unknown craft action: ${message.action}`);
                        }
                    }
                    break;
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

        // Convert the CSS file path to a URI that the webview can use
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview.css'));
        html = html.replace(
            /<link rel="stylesheet" href="webview.css">/,
            `<link rel="stylesheet" href="${cssUri}">`
        );

        // Convert the JavaScript file path to a URI that the webview can use
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview.js'));
        html = html.replace(
            /<script src="webview.js"><\/script>/,
            `<script src="${scriptUri}"></script>`
        );

        return html;
    }
}