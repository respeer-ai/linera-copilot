// 消息输入组件 - 负责消息输入框、发送按钮、消息列表相关的逻辑

// 消息输入组件类
export class MessageInput {
    constructor(vscode) {
        this.vscode = vscode;
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.messageList = document.getElementById('message-list');
        this.messageInputContainer = document.getElementById('message-input-container');
        
        this.initEventListeners();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 输入框高度自适应
        this.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
        });

        // 发送消息
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // 按下 Enter 键发送消息（不按 Shift）
        this.messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        });

        // 监听来自 VSCode 的消息
        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.command) {
                case 'add-message':
                    this.addMessage(message.text, message.sender);
                    break;
                case 'setPrompt':
                    this.setPrompt(message.text);
                    break;
            }
        });
    }

    // 调整文本区域高度
    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        // 限制最小高度为128px，最大高度为200px
        const newHeight = Math.min(Math.max(this.messageInput.scrollHeight, 128), 200);
        this.messageInput.style.height = newHeight + 'px';
    }

    // 发送消息
    sendMessage() {
        const text = this.messageInput.value.trim();
        if (text) {
            this.addMessage(text, 'user');
            this.vscode.postMessage({
                command: 'prompt',
                text: text
            });
            this.messageInput.value = '';
            this.adjustTextareaHeight();
        }
    }

    // 添加消息到消息列表
    addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = text;
        
        messageElement.appendChild(contentElement);
        this.messageList.appendChild(messageElement);
        
        // 滚动到底部
        this.messageList.scrollTop = this.messageList.scrollHeight;
    }

    // 设置提示文本
    setPrompt(text) {
        this.messageInput.value = text;
        this.adjustTextareaHeight();
        this.messageInput.focus();
    }

    // 显示消息输入区域
    show() {
        this.messageInputContainer.style.display = 'flex';
    }

    // 隐藏消息输入区域
    hide() {
        this.messageInputContainer.style.display = 'none';
    }
}

// 导出初始化函数
export function initMessageInput(vscode) {
    return new MessageInput(vscode);
}