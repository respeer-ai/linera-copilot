import { PluginSettings } from '../settings';

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  text: string; // Optional, for human-readable description
}

// LLM API response structure
export type LLMResponse =
  | {
      type: 'text';
      text: string;
      isComplete: boolean;
    }
  | {
      type: 'tool_call';
      toolCalls: ToolCall[];
      isComplete: boolean;
    }
  | {
      type: 'error';
      text: string;
      isComplete: boolean;
    };

/**
 * Makes a single request to LLM API and returns the response
 * @param prompt The input prompt for the LLM
 * @param options Configuration options for the request
 * @param options.jsonFormat Whether to return response in JSON format (default: false)
 * @returns Promise resolving to LLM response text
 */
export async function requestLLMResponse(
  personality: string,
  prompt: string,
  options: { jsonFormat?: boolean, isList?: boolean } = {},
  jsonExample?: any
): Promise<string> {
  const apiUrl = PluginSettings.getModelUrl();
  const apiKey = PluginSettings.getApiToken();
  const modelName = PluginSettings.getModelName();

  if (!apiUrl || !apiKey) {
    throw new Error('LLM API configuration is missing');
  }

  if (options.jsonFormat) {
    const example = JSON.stringify(jsonExample)
    prompt += `\nReturn ONLY a JSON ${options.isList ? "array" : "object"}, with each step following this structure: ${example}\n`
    if (options.isList) {
      prompt += '\nIt could have nested items.'
    }
  }

  // Prepare the request
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: personality
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(prompt, data)
  
  // Default to text content
  return (data.choices?.[0]?.message?.content as string)?.replace('```json', '').replace('```', '') || '';
}


/**
 * Streams text from LLM API and yields processed chunks
 */
export async function* streamLLMResponse(personality: string, prompt: string): AsyncGenerator<LLMResponse, void, unknown> {
  const apiUrl = PluginSettings.getModelUrl();
  const apiKey = PluginSettings.getApiToken();
  const modelName = PluginSettings.getModelName();
  
  if (!apiUrl || !apiKey) {
    throw new Error('LLM API configuration is missing');
  }

  // Prepare the request
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-SSE': 'enable'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: personality
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API request failed: ${response.statusText}`);
  }

  // Process streaming response
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get reader from response');
  }

  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Final chunk - mark as complete
        if (buffer) {
          yield { type: 'text', text: buffer, isComplete: true };
        }
        break;
      }

      // Decode the chunk and process it
      const chunk = new TextDecoder().decode(value);
      buffer += chunk;

      // Simple parsing for SSE format (assuming DashScope SSE format)
      // Format: data: {"choices":[{"delta":{"content":"text"}}]}
      const lines = buffer.split('\n').filter(line => line.trim());
      buffer = '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.substring(5).trim();
            if (jsonStr === '[DONE]') {
              // Final chunk - mark as complete
              yield { type: 'text', text: '', isComplete: true };
              break;
            }
            const data = JSON.parse(jsonStr);
            if (data.choices && data.choices.length > 0 && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              if (content) {
                yield { type: 'text', text: content, isComplete: false };
              }
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during LLM streaming:', error);
    throw error;
  }
}

export async function* requestToolCallsStream(
  prompt: string
): AsyncGenerator<LLMResponse, void, unknown> {
  const apiUrl = PluginSettings.getModelUrl();
  const apiKey = PluginSettings.getApiToken();
  const modelName = PluginSettings.getModelName();

  if (!apiUrl || !apiKey) {
    throw new Error("LLM API configuration is missing");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content: `
First, output a message for the user describing what you are going to do.
Then, in a separate line starting with "TOOL_CALL:", output the JSON array of tool calls.
Do not mix them together.

Example:

I will now install Linera SDK version v1.1.0 for you.

TOOL_CALL:
[
  {
    "name": "installLineraSdk",
    "args": { "version": "v1.1.0", "withExamples": false },
    "text": "I will now install Linera SDK version v1.1.0 for you."
  }
]
`.trim(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    yield {
      type: "error",
      text: `LLM API request failed: ${response.statusText}`,
      isComplete: true,
    };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let collectingToolCall = false;
  let toolCallBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    buffer += chunk;

    if (!collectingToolCall) {
      const toolCallIndex = buffer.indexOf("TOOL_CALL:");
      if (toolCallIndex !== -1) {
        const textPart = buffer.slice(0, toolCallIndex);
        if (textPart.trim()) {
          yield {
            type: "text",
            text: textPart.trim(),
            isComplete: false,
          };
        }
        collectingToolCall = true;
        toolCallBuffer += buffer.slice(toolCallIndex + "TOOL_CALL:".length);
        buffer = "";
      } else {
        if (buffer.trim()) {
          yield {
            type: "text",
            text: buffer,
            isComplete: false,
          };
          buffer = "";
        }
      }
    } else {
      toolCallBuffer += buffer;
      buffer = "";
    }
  }

  if (toolCallBuffer.trim()) {
    try {
      const toolCalls: ToolCall[] = JSON.parse(toolCallBuffer.trim());
      yield {
        type: "tool_call",
        toolCalls,
        isComplete: true,
      };
    } catch (e) {
      yield {
        type: "error",
        text: "Failed to parse tool calls from LLM response",
        isComplete: true,
      };
    }
  } else {
    yield {
      type: "text",
      text: "",
      isComplete: true,
    };
  }
}

/* 
// Example usage:
async function exampleUsage() {
  try {
    const prompt = "Explain the concept of recursion";
    const responseGenerator = streamLLMResponse(prompt);
    
    for await (const response of responseGenerator) {
      if (response.isComplete) {
        console.log("Final response:", response.text);
      } else {
        console.log("Received chunk:", response.text);
        // Update UI with the chunk here
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

exampleUsage();
*/
