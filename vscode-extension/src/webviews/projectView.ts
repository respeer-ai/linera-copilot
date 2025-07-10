import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
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

        // 设置 Content Security Policy 允许加载外部资源
        const cspSource = webviewView.webview.cspSource;
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, cspSource);

        // 设置消息监听器
        setupMessageListener(webviewView);
    }

    private _getHtmlForWebview(webview: vscode.Webview, cspSource: string) {
        // Generate random nonce
        const nonce = getNonce();
        
        // Get path to main webview HTML
        const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Generate resource URIs
        const getWebviewUri = (...pathSegments: string[]) => {
            return webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, ...pathSegments)
            ).toString();
        };

        const codiconUri = getWebviewUri('node_modules', '@vscode', 'codicons', 'dist', 'codicon.css');
        const cssUri = getWebviewUri('src', 'webview.css');
        const jsUri = getWebviewUri('src', 'webview.js');

        // Strict Content Security Policy
        const csp = [
            "default-src 'none'",
            `img-src ${webview.cspSource} https:`,
            `script-src 'nonce-${nonce}'`,
            `style-src 'nonce-${nonce}' ${webview.cspSource}`,
            `font-src ${webview.cspSource}`
        ].join('; ');

        // Replace resource paths and add CSP
        html = html
            .replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`)
            .replace('https://cdn.jsdelivr.net/npm/@vscode/codicons/dist/codicon.css', codiconUri)
            .replace('href="webview.css"', `href="${cssUri}" nonce="${nonce}"`)
            .replace('src="webview.js"', `src="${jsUri}" nonce="${nonce}"`)
            .replace(/%7B%codiconUri%%7D/g, codiconUri)
            .replace(/%7B%cssUri%%7D/g, cssUri);

        // Inject page content
        const injectPageContent = (placeholder: string, pagePath: string) => {
            const fullPath = path.join(this._extensionUri.fsPath, ...pagePath.split('/'));
            const pageHtml = fs.readFileSync(fullPath, 'utf8');
            return html.replace(placeholder, pageHtml);
        };

        html = injectPageContent(
            '<!-- CRAFT_CONTENT_PLACEHOLDER -->',
            'src/craft/page.html'
        );
        
        html = injectPageContent(
            '<!-- SETTINGS_CONTENT_PLACEHOLDER -->',
            'src/settings/page.html'
        );

        return html;
    }
}