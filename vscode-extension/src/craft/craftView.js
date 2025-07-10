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
        try {
            // 发送 craft-action 消息
            this.vscode.postMessage({
                command: 'craft-action',
                action: action
            });
            
            // 设置提示文本
            let promptText = '';
            switch (action) {
                case 'create-2048-game':
                    promptText = 'I want to create a 2048 game. Please break this task down into smaller steps.';
                    break;
                default:
                    promptText = 'I want to complete this task. Please help me break it down.';
            }
            
            // 确保元素存在
            if (!this.craftPanel) {
                console.error('craftPanel element not found');
                return;
            }
            
            if (!this.messageInput) {
                console.error('messageInput not initialized');
                return;
            }
            
            // 隐藏 Craft 页面
            if (this.craftPanel) {
                this.craftPanel.style.display = 'none';
            }
            
            // 通过postMessage设置提示文本
            window.postMessage({
                command: 'setPrompt',
                text: promptText
            }, '*');
        } catch (error) {
            console.error('Error in handleCardClick:', error);
        }
    }
}

// 导出初始化函数
export function initCraftView(vscode) {
    // 确保DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            return new CraftView(vscode);
        });
    } else {
        return new CraftView(vscode);
    }
}