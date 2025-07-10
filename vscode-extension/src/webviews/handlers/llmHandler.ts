import * as vscode from 'vscode';
import axios from 'axios';

/**
 * 处理LLM提示消息
 * @param webview webview实例
 * @param prompt 提示内容
 */
export async function handlePromptLLM(webview: vscode.Webview, prompt: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('linera');
    const modelUrl = config.get<string>('modelUrl');
    const apiToken = config.get<string>('apiToken');
    const modelName = config.get<string>('modelName');

    if (!modelUrl || !apiToken || !modelName) {
        vscode.window.showErrorMessage('LLM settings are not configured. Please set them in the Settings tab.');
        webview.postMessage({ command: 'streamResponse', text: 'Error: LLM settings are not configured.' });
        webview.postMessage({ command: 'streamEnd' });
        return;
    }

    try {
        const response = await axios.post(
            modelUrl,
            {
                model: modelName,
                prompt: prompt,
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
            webview.postMessage({ command: 'streamResponse', text });
        });

        response.data.on('end', () => {
            webview.postMessage({ command: 'streamEnd' });
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
        webview.postMessage({ command: 'streamResponse', text: `Error: ${errorMessage}` });
        webview.postMessage({ command: 'streamEnd' });
    }
}