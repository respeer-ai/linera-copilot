// Craft 视图 - 处理卡片点击事件
import { initMessageInput } from '../components/messageInput.js';

export class CraftView {
    constructor(vscode) {
        this.vscode = vscode;
        this.craftPanel = document.getElementById('craft-panel');
        this.cards = document.querySelectorAll('.card');
        
        // 初始化消息输入组件，传递 vscode 对象
        this.messageInput = initMessageInput(vscode);
        
        this.initEventListeners();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 为每个卡片添加点击事件
        this.cards.forEach(card => {
            card.addEventListener('click', (event) => {
                const action = card.getAttribute('data-action');
                if (action) {
                    this.handleCardClick(action);
                }
            });
        });
    }

    // 处理卡片点击事件
    handleCardClick(action) {
        // 发送 craft-action 消息
        this.vscode.postMessage({
            command: 'craft-action',
            action: action
        });
        
        // 隐藏 Craft 页面，显示消息输入区域
        this.craftPanel.style.display = 'none';
        this.messageInput.show();
    }
}

// 导出初始化函数
export function initCraftView(vscode) {
    return new CraftView(vscode);
}