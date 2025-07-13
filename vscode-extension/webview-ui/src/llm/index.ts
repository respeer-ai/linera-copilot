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

  // ========= Phase 1: Request for user-friendly text only =========
  const textResponse = await fetch(apiUrl, {
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
You are a programming assistant. When you respond, only describe to the user in plain text what you plan to do.
DO NOT include any TOOL_CALL: section in this response.
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

  if (!textResponse.ok) {
    yield {
      type: "error",
      text: `LLM text phase request failed: ${textResponse.statusText}`,
      isComplete: true,
    };
    return;
  }

  const textReader = textResponse.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await textReader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const dataStr = trimmed.replace("data:", "").trim();
      if (dataStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(dataStr);
        const content = parsed?.choices?.[0]?.delta?.content;
        if (typeof content === "string" && content.trim()) {
          yield {
            type: "text",
            text: content,
            isComplete: false,
          };
        }
      } catch (e) {
        console.warn("Failed to parse text stream:", e);
      }
    }
  }

  // ========= Phase 2: Request TOOL_CALLs only =========
  const toolResponse = await fetch(apiUrl, {
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
Respond ONLY with the TOOL_CALL JSON array, no explanation.
Format:
[
  {
    "name": "install_linera_sdk",
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
      stream: false,
      tools: [
        {
          type: "function",
          function: {
            name: "install_rust",
            description: "Installs Rust development toolchain with the specified version and release channel. Recommended versions for Linera SDK are typically stable or nightly channels with recent versions like 1.70.0 or newer.",
            parameters: {
              type: "object",
              properties: {
                version: {
                  type: "string",
                  description: "Cargo version to install, e.g. 1.70.0"
                },
                channel: {
                  type: "string",
                  description: "Rust release channel to use, e.g. stable, beta, nightly",
                  enum: ["stable", "beta", "nightly"]
                }
              },
              required: ["version"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "install_protoc",
            description: "Installs Protocol Buffers compiler (protoc) with the specified version.",
            parameters: {
              type: "object",
              properties: {
                version: {
                  type: "string",
                  description: "Version of protoc to install, e.g. 3.21.7"
                },
                platform: {
                  type: "string",
                  description: "Target platform for installation, e.g. linux, windows, macos",
                  enum: ["linux", "windows", "macos"]
                }
              },
              required: ["version", "platform"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "install_linera_sdk",
            description: "Installs the specified version of the Linera SDK.",
            parameters: {
              type: "object",
              properties: {
                version: {
                  type: "string",
                  description: "Linera SDK version number, e.g. v1.1.0"
                },
                withExamples: {
                  type: "boolean",
                  description: "Whether to install example projects alongside the SDK",
                  default: false
                }
              },
              required: ["version"]
            }
          }
        }
      ],
      toolCall: "auto"
    }),
  });

  if (!toolResponse.ok) {
    yield {
      type: "error",
      text: `LLM tool call request failed: ${toolResponse.statusText}`,
      isComplete: true,
    };
    return;
  }

  const data = await toolResponse.json();
  const content = data?.choices?.[0]?.message?.content;
  const _toolCalls = data?.choices?.[0]?.message?.toolCalls;

  console.log(data, content, _toolCalls)

  try {
    if (_toolCalls?.length > 0) {
      const toolCalls: ToolCall[] = JSON.parse(JSON.stringify(_toolCalls));
      yield {
        type: "tool_call",
        toolCalls,
        isComplete: true,
      };
    } else if (typeof content === "string" && content.trim()) {
      yield {
        type: "error",
        text: content,
        isComplete: true,
      };
    } else {
      yield {
        type: "error",
        text: "LLM response did not contain any tool calls",
        isComplete: true,
      };
    }
  } catch (e) {
    yield {
      type: "error",
      text: `Failed to parse tool call stream: ${e}`,
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
