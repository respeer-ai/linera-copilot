const vscode = acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.querySelector('.message-input');
    const sendButton = document.querySelector('.send-button');
    const messageList = document.querySelector('.message-list');
    const craftBody = document.querySelector('.craft-body');
    const messageListContainer = document.querySelector('.message-list-container');
    
    // Tab switching functionality
    const tabItems = document.querySelectorAll('.tab-item');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
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
                }
            }
        });
    });

    // Handle card clicks
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const action = card.dataset.action;
            if (action) {
                vscode.postMessage({ command: 'craft-action', action: action });
                craftBody.style.display = 'none';
                messageListContainer.style.display = 'flex';
            }
        });
    });

    // Handle message sending
    sendButton.addEventListener('click', () => {
        const message = messageInput.value;
        if (message) {
            vscode.postMessage({ command: 'send-message', text: message });
            messageInput.value = '';
            addMessage('user', message);
            messageInput.style.height = 'auto';
            sendButton.disabled = true;
        }
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    // Auto-resize textarea and manage send button state
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
        sendButton.disabled = messageInput.value.trim() === '';
    });

    // Initial state of the send button
    sendButton.disabled = true;

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'add-message':
                addMessage(message.type, message.text);
                break;
        }
    });

    function addMessage(type, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.textContent = text;
        messageList.appendChild(messageElement);
        messageList.scrollTop = messageList.scrollHeight;
    }
});