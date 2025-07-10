// 主视图 - 负责 Tab 切换功能，初始化 Craft 视图和 Settings 视图
import { initCraftView } from './craft/craftView.js';
import { initSettingsView } from './settings/settingsView.js';

// 只调用一次 acquireVsCodeApi()
const vscode = acquireVsCodeApi();

// 主视图类
class MainView {
    constructor() {
        this.tabItems = document.querySelectorAll('.tab-item');
        this.tabPanels = document.querySelectorAll('.tab-panel');
        
        this.initEventListeners();
        this.initViews();
    }

    // 初始化事件监听器
    initEventListeners() {
        // Tab 切换功能
        this.tabItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.getAttribute('data-tab');
                this.activateTab(tabId);
            });
        });
    }

    // 初始化其他视图
    initViews() {
        // 初始化 Craft 视图，传递 vscode 对象
        this.craftView = initCraftView(vscode);
        
        // 初始化 Settings 视图，传递 vscode 对象
        this.settingsView = initSettingsView(vscode);
    }

    // 激活指定的 Tab
    activateTab(tabId) {
        try {
            // 更新 Tab 项的激活状态
            this.tabItems.forEach(item => {
                if (item.getAttribute('data-tab') === tabId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // 更新 Tab 面板的显示状态
            this.tabPanels.forEach(panel => {
                if (panel.id === tabId + '-panel') {
                    panel.classList.add('active');
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.remove('active');
                    panel.classList.add('hidden');
                }
            });
        } catch (error) {
            console.error('Tab activation error:', error);
        }
    }
}

// 初始化主视图
document.addEventListener('DOMContentLoaded', () => {
    const mainView = new MainView();
});