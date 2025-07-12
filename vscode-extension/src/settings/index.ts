import * as vscode from 'vscode';

/**
 * VSCode 插件通用设置管理类
 * 使用 localStorage 存储插件配置
 */
export class PluginSettings {
    private static readonly STORAGE_KEY = 'lineraCopilot';

    /**
     * 获取所有设置
     */
    public static getAllSettings() {
        const config = vscode.workspace.getConfiguration(this.STORAGE_KEY);
        return {
            sdkVersion: config.get('sdkVersion'),
            modelUrl: config.get('modelUrl'),
            apiToken: config.get('apiToken'),
            modelName: config.get('modelName'),
            projectRoot: config.get('projectRoot'),
        };
    }

    /**
     * 保存所有设置
     */
    public static async saveAllSettings(settings: Record<string, string>) {
        const config = vscode.workspace.getConfiguration(this.STORAGE_KEY);
        for (const key in settings) {
            if (settings.hasOwnProperty(key)) {
                await config.update(key, settings[key], vscode.ConfigurationTarget.Global);
            }
        }
    }

    /**
     * 获取SDK版本
     */
    public static getSdkVersion(): string {
        return this.getSetting('sdkVersion');
    }

    /**
     * 设置SDK版本
     */
    public static setSdkVersion(version: string): void {
        this.setSetting('sdkVersion', version);
    }

    /**
     * 获取模型URL
     */
    public static getModelUrl(): string {
        return this.getSetting('modelUrl');
    }

    /**
     * 设置模型URL
     */
    public static setModelUrl(url: string): void {
        this.setSetting('modelUrl', url);
    }

    /**
     * 获取API Token
     */
    public static getApiToken(): string {
        return this.getSetting('apiToken');
    }

    /**
     * 设置API Token
     */
    public static setApiToken(token: string): void {
        this.setSetting('apiToken', token);
    }

    /**
     * 获取模型名称
     */
    public static getModelName(): string {
        return this.getSetting('modelName');
    }

    /**
     * 设置模型名称
     */
    public static setModelName(name: string): void {
        this.setSetting('modelName', name);
    }

    /**
     * 获取项目根目录
     */
    public static getProjectRoot(): string {
        return this.getSetting('projectRoot');
    }

    /**
     * 设置项目根目录
     */
    public static setProjectRoot(root: string): void {
        this.setSetting('projectRoot', root);
    }

    /**
     * 获取单个设置项
     */
    private static getSetting(key: string): string {
        const settings = this.getAllSettings() as Record<string, string>;
        return settings[key] || '';
    }

    /**
     * 设置单个设置项
     */
    private static setSetting(key: string, value: string): void {
        const settings = this.getAllSettings() as Record<string, string>;
        settings[key] = value;
        this.saveAllSettings(settings);
    }
}
