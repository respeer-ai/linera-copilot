import { type ToolCall } from '../llm';
import { createLoadingHtml } from '../waiting';

/**
 * Generates HTML for displaying a running tool call with text on the left and waiting status on the right.
 * @param text The text to display on the left side.
 * @returns HTML string representing the running tool call status.
 */
export function generateToolCallRunningHtml(toolCall: ToolCall): string {
    return createLoadingHtml(toolCall.text)
}
