const vscode = acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', function() {
    // 获取UI元素
    const messageInput = document.querySelector('.message-input');
    const sendButton = document.querySelector('.send-button');
    const messageList = document.querySelector('.message-list');
    const craftBody = document.querySelector('.craft-body');
    const messageListContainer = document.querySelector('.message-list-container');
    
    // Tab switching functionality
    const tabItems = document.querySelectorAll('.tab-item');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    console.log('Tab items:', tabItems.length);
    console.log('Tab panels:', tabPanels.length);
    
    if (tabItems.length > 0 && tabPanels.length > 0) {
        tabItems.forEach(tab => {
            tab.addEventListener('click', () => {
                console.log('Tab clicked:', tab.getAttribute('data-tab'));
                
                // Remove active class from all tabs and panels
                tabItems.forEach(item => item.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Get the target panel id from the tab's data-tab attribute
                const targetId = tab.getAttribute('data-tab');
                if (targetId) {
                    // Add active class to the corresponding panel
                    const targetPanel = document.getElementById(targetId);
                    if (targetPanel) {
                        targetPanel.classList.add('active');
                        console.log('Activated panel:', targetId);
                    } else {
                        console.error('Panel not found:', targetId);
                    }
                }
            });
        });
    } else {
        console.error('Tab items or panels not found');
    }

    // Handle card clicks
    const cards = document.querySelectorAll('.card');
    if (cards.length > 0) {
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                if (action) {
                    vscode.postMessage({ command: 'craft-action', action: action });
                    if (craftBody) craftBody.style.display = 'none';
                    if (messageListContainer) messageListContainer.style.display = 'flex';
                    // 确保message-input的高度在128px到200px之间
                    if (messageInput) {
                        adjustMessageInputHeight(messageInput);
                    }
                }
            });
        });
    }

    // Handle message sending if the elements exist
    if (sendButton && messageInput && messageList) {
        sendButton.addEventListener('click', () => {
            const message = messageInput.value;
            if (message) {
                vscode.postMessage({ command: 'send-message', text: message });
                messageInput.value = '';
                addMessage('user', message);
                adjustMessageInputHeight(messageInput);
                sendButton.disabled = true;
            }
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendButton.click();
            }
        });

        /**
         * 调整消息输入框的高度
         * @param {HTMLTextAreaElement} input - 消息输入框元素
         */
        function adjustMessageInputHeight(input) {
            // 限制最小高度为128px，最大高度为200px
            const newHeight = Math.min(Math.max(input.scrollHeight, 128), 200);
            input.style.height = newHeight + 'px';
        }

        // Auto-resize textarea and manage send button state
        messageInput.addEventListener('input', () => {
            adjustMessageInputHeight(messageInput);
            sendButton.disabled = messageInput.value.trim() === '';
        });

        // Initial state of the send button
        sendButton.disabled = true;
    }

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'add-message':
                if (typeof addMessage === 'function') {
                    addMessage(message.type, message.text);
                }
                break;
            case 'setPrompt':
                if (messageInput && message.prompt) {
                    messageInput.value = message.prompt;
                    adjustMessageInputHeight(messageInput);
                    sendButton.disabled = false;
                    // Focus on the input field
                    messageInput.focus();
                }
                break;
        }
    });

    // Define addMessage function only if messageList exists
    function addMessage(type, text) {
        if (!messageList) return;
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.textContent = text;
        messageList.appendChild(messageElement);
        messageList.scrollTop = messageList.scrollHeight;
    }
});