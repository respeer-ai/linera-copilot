import { type ToolCall } from '../llm';

/**
 * Generates HTML for displaying a running tool call with text on the left and waiting status on the right.
 * @param text The text to display on the left side.
 * @returns HTML string representing the running tool call status.
 */
export function generateToolCallRunningHtml(toolCall: ToolCall): string {
    return `
        <div class="tool-call-running" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 8px 16px;
            border-radius: 4px;
            background-color: rgba(255, 255, 255, 0.7);
            margin: 4px 0;
        ">
            <span style="text-align: left; flex-grow: 1;">${toolCall.text}</span>
            <span style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 20px;
                background-color: rgba(0, 0, 0, 0.1);
                border-radius: 10px;
            ">
                <span style="display: inline-block; width: 12px; height: 12px; border: 2px solid #ccc; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite;"></span>
            </span>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
}
