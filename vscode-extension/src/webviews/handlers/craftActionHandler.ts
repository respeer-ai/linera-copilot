import * as vscode from 'vscode';

/**
 * 处理craft-action消息
 * @param webview webview实例
 * @param action 动作类型
 */
export function handleCraftAction(webview: vscode.Webview, action: string): void {
    switch (action) {
        case 'create-2048-game':
            webview.postMessage({ 
                command: 'setPrompt', 
                prompt: 'Create a 2048 game using Linera microchain technology.' 
            });
            break;
        case 'create-counter-program':
            webview.postMessage({ 
                command: 'setPrompt', 
                prompt: 'Create a counter program using Linera microchain technology.' 
            });
            break;
        case 'explain-project':
            webview.postMessage({ 
                command: 'setPrompt', 
                prompt: 'Explain how Linera microchain technology works and its benefits.' 
            });
            break;
        case 'execute-project':
            webview.postMessage({ 
                command: 'setPrompt', 
                prompt: 'How do I execute and deploy a Linera microchain project?' 
            });
            break;
        default:
            console.log(`Unknown craft action: ${action}`);
    }
}