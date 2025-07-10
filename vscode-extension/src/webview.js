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
        this.initializedTabs = new Set(); // Track initialized tabs

        this.initEventListeners();
        // Activate the default tab on load
        this.activateTab('craft', true);
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

    // 初始化视图
    initView(tabId) {
        if (this.initializedTabs.has(tabId)) {
            return; // Already initialized
        }

        if (tabId === 'craft') {
            initCraftView(vscode);
        } else if (tabId === 'settings') {
            initSettingsView(vscode);
        }
        
        this.initializedTabs.add(tabId);
    }

    // 激活指定的 Tab
    activateTab(tabId, isInitial = false) {
        try {
            if (!isInitial) {
                this.initView(tabId);
            }

            // 更新 Tab 项的激活状态
            this.tabItems.forEach(item => {
                item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
            });

            // 更新 Tab 面板的显示状态
            this.tabPanels.forEach(panel => {
                panel.classList.toggle('active', panel.id === tabId);
            });
        } catch (error) {
            console.error(`Tab activation error for tab "${tabId}":`, error);
        }
    }
}

// 初始化主视图
document.addEventListener('DOMContentLoaded', () => {
    const mainView = new MainView();
    // Initialize the default view right away
    mainView.initView('craft');
});