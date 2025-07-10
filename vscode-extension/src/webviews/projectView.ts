import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { setupMessageListener } from './messageDispatcher';

export class LineraPanelViewProvider implements vscode.WebviewViewProvider {

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

        // 设置消息监听器
        setupMessageListener(webviewView);

        // 设置webview的HTML内容
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