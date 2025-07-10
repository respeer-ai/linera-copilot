// Craft 视图 - 处理卡片点击事件
import { initMessageInput } from '../components/messageInput.js';

export class CraftView {
    constructor(vscode) {
        this.vscode = vscode;
        this.craftBody = document.querySelector('.craft-body');
        this.messageListContainer = document.getElementById('message-list-container');
        
        if (!this.craftBody || !this.messageListContainer) {
            console.error('Missing required DOM elements in CraftView');
            return;
        }
        
        this.cards = document.querySelectorAll('.card');
        
        // 初始化消息输入组件
        this.messageInput = initMessageInput();
        
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
        console.log('[CraftView] Handling card click for action:', action);
        
        // 发送 craft-action 消息
        console.log('[CraftView] Sending craft-action message:', {command: 'craft-action', action});
        this.vscode.postMessage({
            command: 'craft-action', 
            action: action
        });
        
        // 隐藏 craft-body，显示消息列表区域
        console.log('[CraftView] Hiding craft body and showing message list');
        this.craftBody.style.display = 'none';
        this.messageListContainer.style.display = 'block';
        this.messageInput.show();
        
        console.log('[CraftView] Waiting for handleCraftAction to process the message...');
    }
}

// 导出初始化函数
export function initCraftView(vscode) {
    return new CraftView(vscode);
}