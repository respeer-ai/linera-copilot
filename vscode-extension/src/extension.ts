import * as vscode from 'vscode';
import * as path from 'path';
import { onMessage } from './webview/messageDispatcher';

class LineraCopilotViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'linera-copilot-webview';

    constructor(private readonly _extensionContext: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(
            this._extensionContext.extensionUri,
            "webview-ui",
            "dist"
          ),
          vscode.Uri.joinPath(
            this._extensionContext.extensionUri,
            "webview-ui",
            "dist",
            "assets"
          ),
        ],
      };

      const manifest = require(path.join(
        this._extensionContext.extensionPath,
        "webview-ui/dist/.vite/manifest.json"
      ));
      const mainScript = manifest["index.html"]["file"];
      const cssFiles = manifest["index.html"]["css"] || [];

      const scriptUri = webviewView.webview.asWebviewUri(
        vscode.Uri.joinPath(
          this._extensionContext.extensionUri,
          "webview-ui",
          "dist",
          mainScript
        )
      );
      const cssUris = cssFiles.map((file: string) =>
        webviewView.webview.asWebviewUri(
          vscode.Uri.joinPath(
            this._extensionContext.extensionUri,
            "webview-ui",
            "dist",
            file
          )
        )
      );

      webviewView.webview.html = this.getWebviewContent(
        scriptUri.toString(),
        cssUris.map((uri: vscode.Uri) => uri.toString())
      );

      webviewView.webview.onDidReceiveMessage(
        (message) => onMessage(webviewView.webview, message),
        undefined,
        this._extensionContext.subscriptions
      );
    }

    private getWebviewContent(scriptUri: string, cssUris: string[]): string {
        const cssLinks = cssUris.map(uri => `<link rel="stylesheet" href="${uri}">`).join('\n');
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Linera Copilot</title>
                ${cssLinks}
            </head>
            <body>
                <div id="app"></div>
                <script type="module" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}

export function activate(context: vscode.ExtensionContext) {
    const provider = new LineraCopilotViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(LineraCopilotViewProvider.viewType, provider)
    );
}

export function deactivate() {}

