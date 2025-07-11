/**
 * Generates an HTML string with a loading spinner in a styled container
 * @param text Optional text to display below the spinner
 * @returns HTML string with loading spinner and optional text
 */
export function createLoadingHtml(text: string = ''): string {
    return `
        <div style="
            border-radius: 8px;
            background-color: rgba(0, 0, 0, 0.5);
            padding: 20px;
            display: flex;
            flex-direction: row;
            align-items: center;
            color: white;
        ">
            <div style="
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top: 4px solid white;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin-right: 10px;
            "></div>
            <div>${text}</div>
        </div>

        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}
