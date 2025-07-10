import * as vscode from 'vscode';

/**
 * 处理获取设置消息
 * @param webview webview实例
 */
export async function handleGetSettings(webview: vscode.Webview): Promise<void> {
    const config = vscode.workspace.getConfiguration('linera');
    const settings = {
        modelUrl: config.get('modelUrl'),
        apiToken: config.get('apiToken'),
        projectsRoot: config.get('projectsRoot'),
        modelName: config.get('modelName')
    };
    
    webview.postMessage({ 
        command: 'setSettings', 
        settings 
    });
}

/**
 * 处理保存设置消息
 * @param webview webview实例
 * @param settings 要保存的设置
 */
export async function handleSaveSettings(webview: vscode.Webview, settings: { 
    modelUrl: string, 
    apiToken: string, 
    projectsRoot: string, 
    modelName: string 
}): Promise<void> {
    const config = vscode.workspace.getConfiguration('linera');
    
    await config.update('modelUrl', settings.modelUrl, vscode.ConfigurationTarget.Global);
    await config.update('apiToken', settings.apiToken, vscode.ConfigurationTarget.Global);
    await config.update('projectsRoot', settings.projectsRoot, vscode.ConfigurationTarget.Global);
    await config.update('modelName', settings.modelName, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage('Settings saved.');
}