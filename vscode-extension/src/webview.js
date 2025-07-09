document.addEventListener('DOMContentLoaded', function() {
    const vscode = acquireVsCodeApi();

    const tabs = document.querySelectorAll('.tab-item');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const targetPanel = document.getElementById(tab.dataset.tab);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    const craftTab = document.getElementById('craft');
    if (craftTab) {
        const craftBody = craftTab.querySelector('.craft-body');
        const messageListContainer = craftTab.querySelector('.message-list-container');
        const messageList = craftTab.querySelector('.message-list');
        const create2048GameCard = craftTab.querySelector('.card[data-action="create-2048-game"]');

        if (create2048GameCard) {
            create2048GameCard.addEventListener('click', () => {
                if (craftBody) craftBody.style.display = 'none';
                if (messageListContainer) messageListContainer.style.display = 'flex';
                if (messageList) messageList.innerHTML = ''; // Clear previous messages

                const prompt = "You are a world-class software engineer. Create a plan to build a 2048 game using the Linera framework. Break it down into a list of actionable steps.";

                // Display user prompt
                const userMessage = document.createElement('div');
                userMessage.className = 'message user';
                userMessage.textContent = prompt;
                messageList.appendChild(userMessage);

                // Send prompt to extension
                vscode.postMessage({
                    command: 'promptLLM',
                    prompt: prompt
                });

                // Create assistant message container
                const assistantMessage = document.createElement('div');
                assistantMessage.className = 'message assistant';
                assistantMessage.textContent = 'Thinking...';
                messageList.appendChild(assistantMessage);
            });
        }
    }

    const settingsTab = document.getElementById('settings');
    if (settingsTab) {
        const saveButton = document.getElementById('save-settings');
        const modelUrlInput = document.getElementById('model-url');
        const apiTokenInput = document.getElementById('api-token');
        const projectsRootInput = document.getElementById('projects-root');
        const modelNameInput = document.getElementById('model-name');

        // Load settings
        vscode.postMessage({ command: 'getSettings' });

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const settings = {
                    modelUrl: modelUrlInput.value,
                    apiToken: apiTokenInput.value,
                    projectsRoot: projectsRootInput.value,
                    modelName: modelNameInput.value
                };
                vscode.postMessage({
                    command: 'saveSettings',
                    settings: settings
                });
            });
        }
    }
    
    let assistantMessage;
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'setSettings':
                if (document.getElementById('model-url')) document.getElementById('model-url').value = message.settings.modelUrl || '';
                if (document.getElementById('api-token')) document.getElementById('api-token').value = message.settings.apiToken || '';
                if (document.getElementById('projects-root')) document.getElementById('projects-root').value = message.settings.projectsRoot || '';
                if (document.getElementById('model-name')) document.getElementById('model-name').value = message.settings.modelName || '';
                break;
            case 'streamResponse':
                if (!assistantMessage) {
                    const messageList = document.querySelector('#craft .message-list');
                    assistantMessage = messageList.querySelector('.message.assistant');
                    if (assistantMessage) {
                        assistantMessage.textContent = ''; // Clear "Thinking..."
                    }
                }
                if (assistantMessage) {
                    assistantMessage.textContent += message.text;
                }
                break;
            case 'streamEnd':
                assistantMessage = null; // Reset for next response
                break;
        }
    });
});


