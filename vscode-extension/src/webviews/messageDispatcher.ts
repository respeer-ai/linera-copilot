import * as vscode from 'vscode';
import { handleCraftAction } from './handlers/craftActionHandler';
import { handleGetSettings, handleSaveSettings } from './handlers/settingsHandler';
import { handlePromptLLM } from './handlers/llmHandler';

/**
 * 设置消息监听器
 * @param webviewView webview视图
 */
export function setupMessageListener(webviewView: vscode.WebviewView): void {
    webviewView.webview.onDidReceiveMessage(async (message) => {
        console.log('Received message:', message);
        
        switch (message.command) {
            case 'craft-action':
                handleCraftAction(webviewView.webview, message.action);
                break;
                
            case 'getSettings':
                await handleGetSettings(webviewView.webview);
                break;
                
            case 'saveSettings':
                await handleSaveSettings(webviewView.webview, message.settings);
                break;
                
            case 'promptLLM':
                await handlePromptLLM(webviewView.webview, message.prompt);
                break;
                
            default:
                console.log(`Unknown command: ${message.command}`);
        }
    });
}