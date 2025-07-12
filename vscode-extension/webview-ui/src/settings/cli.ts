// 1️⃣ 声明 VSCode API
declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

// 2️⃣ 获取 VSCode API
const vscode = acquireVsCodeApi();

// 3️⃣ 定义消息结构
type MessagePayload<T = any> = {
  command: string;
  success: boolean;
  data?: T;
  updated?: T;
  error?: string;
};

// 4️⃣ 管理所有等待中的请求
const pendingResponses = new Map<string, (payload: MessagePayload) => void>();

// 5️⃣ 接收 Extension 回复消息
window.addEventListener('message', (event) => {
  const payload = event.data as MessagePayload;
  const handler = pendingResponses.get(payload.command);
  if (handler) {
    handler(payload);
    pendingResponses.delete(payload.command);
  }
});

// 6️⃣ 简化发送消息，返回 Promise
function sendCommand<T = any>(command: string, value?: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const responseCommand = `${command}Response`;
    pendingResponses.set(responseCommand, (payload: MessagePayload) => {
      if (payload.success) {
        resolve((payload.data || payload.updated) as T);
      } else {
        reject(new Error(payload.error || "Unknown error"));
      }
    });

    vscode.postMessage(value !== undefined ? { command, value } : { command });
  });
}

// 7️⃣ 导出具体的设置函数（封装到PluginSettings类）
export class PluginSettings {
  static getAllSettings = () =>
    sendCommand<Record<string, string>>("getSettings");
  static getSdkVersion = () => sendCommand<string>("getSdkVersion");
  static setSdkVersion = (version: string) =>
    sendCommand<void>("setSdkVersion", version);
  static getModelUrl = () => sendCommand<string>("getModelUrl");
  static setModelUrl = (url: string) => sendCommand<void>("setModelUrl", url);
  static getApiToken = () => sendCommand<string>("getApiToken");
  static setApiToken = (token: string) =>
    sendCommand<void>("setApiToken", token);
  static getModelName = () => sendCommand<string>("getModelName");
  static setModelName = (name: string) =>
    sendCommand<void>("setModelName", name);
  static getProjectRoot = () => sendCommand<string>("getProjectRoot");
  static setProjectRoot = (root: string) =>
    sendCommand<void>("setProjectRoot", root);
}