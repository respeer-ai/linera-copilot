import { requestLLMResponse } from '../llm';

export interface UserIntent {
    /** 用户输入的原始文本 */
    rawText: string;
    /** LLM解析后的意图描述 */
    intentDescription: string;
    /** 是否与当前编辑器上下文相关 */
    isContextRelevant: boolean;
    /** 意图置信度(0-1) */
    confidence: number;
    /** 建议的操作类型(如'refactor', 'explain', 'generate'等) */
    suggestedAction?: string;
    /** 用户是否请求执行后续任务 */
    requestNextTask: boolean;

}

/**
 * Example of a UserIntent object for demonstration purposes
 */
export const exampleInput: UserIntent = {
    rawText: "How can I refactor this function to be more efficient?",
    intentDescription: "User wants to improve the efficiency of a function through refactoring",
    isContextRelevant: true,
    confidence: 0.9,
    suggestedAction: "refactor",
    requestNextTask: true
};


/**
 * Generates a prompt for LLM to analyze user intent based on input and context.
 * @param userInput The raw text input from the user
 * @param contextText The surrounding context text in the editor
 * @returns A formatted prompt string for the LLM
 */
export function generateIntentAnalysisPrompt(userInput: string, contextText: string): string {
    return `Analyze the following user input and provide a structured JSON response matching the UserIntent interface:
    
    User Input:
    "${userInput}"

    Context:
    "${contextText}"

    Requirements:
    1. Identify the user's primary intent from the input
    2. Determine if this intent is relevant to the provided context (true/false)
    3. Estimate confidence level (0-1) of your intent classification
    4. If applicable, suggest an action type from: 'refactor', 'explain', 'generate', 'debug', 'optimize', or leave empty
    5. Provide a brief description of the identified intent

    Return ONLY a valid JSON object matching this schema:
    {
        "rawText": string,
        "intentDescription": string,
        "isContextRelevant": boolean,
        "confidence": number,
        "suggestedAction"?: string,
        "rquestNextTask": boolean
    }`;
}

/**
 * Analyzes user intent by requesting LLM analysis
 * @param userInput The raw text input from the user
 * @param contextText The surrounding context text in the editor
 * @returns A Promise resolving to the analyzed UserIntent
 */
export async function analyzeUserIntent(userInput: string, contextText: string): Promise<UserIntent> {
    const prompt = generateIntentAnalysisPrompt(userInput, contextText);
    const personality = 'You are an expert at analyzing user intent. Please provide the most accurate analysis possible.';

    const llmResponse = await requestLLMResponse(personality, prompt, { jsonFormat: true }, exampleInput);
    
    try {
        return JSON.parse(llmResponse) as UserIntent;
    } catch (error) {
        throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}`);
    }
}

