/**
 * Generates an HTML string with a success checkmark in a styled container
 * @param text Optional text to display below the checkmark
 * @returns HTML string with success checkmark and optional text
 */
export function createSuccessHtml(text: string = ''): string {
    return `
        <div style="
            width: 100%;
            padding: 12px 16px;
            background-color: rgba(46, 213, 115, 0.1); /* Success green color with transparency */
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
                background-color: rgba(46, 213, 115, 0.8); /* Success green color with transparency */
            ">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 10px;
                    height: 5px;
                    border-left: 2px solid white;
                    border-bottom: 2px solid white;
                    transform: translate(-50%, -60%) rotate(-45deg);
                "></div>
            </div>
        </div>
    `;
}