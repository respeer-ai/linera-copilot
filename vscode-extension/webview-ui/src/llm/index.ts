import { PluginSettings } from '../settings';

/**
 * Represents a function call with its name and arguments
 */
export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolCall {
  function: FunctionCall
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
      taskPrompt: string;
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
    prompt += `\nReturn ONLY a valid JSON ${options.isList ? "array" : "object"}, with each step following this structure: ${example}\n`
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

  console.log(prompt, (data.choices?.[0]?.message?.content as string)?.replace('```json', '').replace('```', ''))
  
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

  // =================== Phase 1: 分析/解释阶段 ===================
  let fullText = "";

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
You are a programming assistant.

Step 1: Analyze the user's request.
If the request can be answered with pure analysis or explanation, directly answer it.
If the request involves any installation, file creation, fetching, or external action, only describe the plan in natural language.

DO NOT include any TOOL_CALL section or JSON output at this stage.
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
      taskPrompt: prompt,
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
          fullText += content;
        }
      } catch (e) {
        console.warn("Failed to parse text stream:", e);
      }
    }
  }

  // =================== Phase 2: 判断是否需要 Tool Call ===================
  const intentResponse = await fetch(apiUrl, {
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
You are a task classifier.

Given a user's request, determine whether it requires calling tools such as install, generate, fetch, or modify external resources.

Respond ONLY with:
TOOL_CALL_REQUIRED: true
or
TOOL_CALL_REQUIRED: false
`.trim(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    }),
  });

  if (!intentResponse.ok) {
    yield {
      type: "error",
      text: `LLM tool call intent detection failed: ${intentResponse.statusText}`,
      taskPrompt: prompt,
      isComplete: true,
    };
    return;
  }

  const intentText = await intentResponse.text();
  const requiresToolCall = intentText.includes("TOOL_CALL_REQUIRED: true");

  if (!requiresToolCall) {
    return;
  }

  // =================== Phase 3: 正式请求 Tool Call ===================
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
You are a DevOps assistant. Based on the user's prompt, decide which tools to call and with what arguments.

If the user's prompt contains a Linera SDK version (e.g. "v1.1.0"), extract it.  
If no version is found, default to Linera SDK version "v0.14.1".

Then determine:

- Rust version:  
  - If Linera SDK is "v0.14.1", use Rust version "1.85.0"  
  - Otherwise, default to "1.85.0"

- Protoc version:  
  - Default to "3.21.7"
  - Use platform "linux-x86_64" unless otherwise specified

Only call tools defined in the system.
Call all relevant tools with appropriate arguments.
Do not explain your reasoning. Do not return plain text or JSON — respond only with function calls.
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
            description: "Installs the Rust programming language and its development toolchain, including rustup, cargo, and rustc. " +
                         "This tool can be used to install or upgrade Rust, set a specific version, or switch between stable and nightly channels. " +
                         "Common use cases include setting up Rust for new environments, preparing for Linera SDK development, or recovering missing Rust installations.",
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
              required: ["version"],
            }
          }
        },
        {
          type: "function",
          function: {
            name: "install_wasm_target",
            description: "Installs the wasm32-unknown-unknown target for Rust compilation.",
            parameters: {
              type: "object",
              properties: {
                rust_version: {
                  type: "string",
                  description: "The Rust version to install the target for, e.g. 1.85.0"
                }
              },
              required: ["rust_version"]
            },
            dependencies: ["install_rust"]
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
            },
            dependencies: ["install_rust", "install_protoc", "install_wasm_target"]
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
      taskPrompt: prompt,
      isComplete: true,
    };
    return;
  }

  const data = await toolResponse.json();
  const content = data?.choices?.[0]?.message?.content;
  const _toolCalls = data?.choices?.[0]?.message?.tool_calls;

  console.log(content, _toolCalls, data)

  try {
    if (_toolCalls?.length > 0) {
      const toolCalls: ToolCall[] = JSON.parse(JSON.stringify(_toolCalls));
      toolCalls.forEach(call => {
        if (!call.text?.trim()) {
          call.text = content;
        }
        if (!call.text?.trim()) {
          call.text = `Executing tool call: ${call.function?.name}`;
        }
      });
      yield {
        type: "tool_call",
        toolCalls,
        isComplete: true,
      };
    } else if (typeof content === "string" && content.trim()) {
      try {
        const toolCalls: ToolCall[] = JSON.parse(content);
        if (toolCalls.length > 0) {
          yield {
            type: "tool_call",
            toolCalls,
            isComplete: true,
          };
          return;
        }
      } catch {
        yield {
          type: "error",
          text: content,
          taskPrompt: prompt,
          isComplete: true,
        };
      }
    } else {
      yield {
        type: "error",
        text: "LLM response did not contain any tool calls",
        taskPrompt: prompt,
        isComplete: true,
      };
    }
  } catch (e) {
    yield {
      type: "error",
      text: `Failed to parse tool call stream: ${e}`,
      taskPrompt: prompt,
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
