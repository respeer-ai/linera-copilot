/**
 * Generates an HTML string with a loading spinner in a styled container
 * @param text Optional text to display below the spinner
 * @returns HTML string with loading spinner and optional text
 */
export function createLoadingHtml(text: string = ''): string {
    return `
        <div style="
            width: 100%;
            padding: 12px 16px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
        ">
            <div style="margin-right: 12px;">${text}</div>
            <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                position: relative;
                animation: rotate 1s linear infinite;
            "></div>
        </div>

        <style>
            @keyframes rotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            div[style*="width: 20px;"]::before,
            div[style*="width: 20px;"]::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            div[style*="width: 20px;"]::before {
                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                animation: clip-rotate 1s linear infinite;
            }
            div[style*="width: 20px;"]::after {
                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                animation: clip-rotate-reverse 1s linear infinite;
            }
            @keyframes clip-rotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(180deg); }
            }
            @keyframes clip-rotate-reverse {
                0% { transform: rotate(180deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}