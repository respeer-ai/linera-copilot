/**
 * Generates an HTML string displaying an error message with an icon.
 * @param errorMessage The text of the error message to display.
 * @returns HTML string with error message and icon.
 */
export function generateErrorHtml(errorMessage: string): string {
    return `
        <div style="
            width: 100%;
            padding: 12px 16px;
            background-color: rgba(255, 0, 0, 0.1);
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
        ">
            <span style="color: #d32f2f; font-weight: 500;">${errorMessage}</span>
            <span style="color: #d32f2f; font-size: 1.2em;">⚠️</span>
        </div>
    `;
}
