import { streamLLMResponse, type LLMResponse } from "../../llm";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  filePaths: string[];
  prompt: string;
  role: string,
  subTasks?: SubTask[]; // Allow nested subtasks
}

export interface CraftTask {
  id: string;
  title: string;
  completed: boolean;
  subTasks: SubTask[];
}

export const exampleTask: CraftTask = {
  id: '1',
  title: 'Develop a full-stack e-commerce platform',
  completed: false,
  subTasks: [
    {
      id: '1-1',
      title: 'Design database schema',
      completed: false,
      prompt: 'Create a normalized database schema for products, users, orders and payments with proper relationships',
      filePaths: ['src/database/schema.ts'],
      role: 'You\'re a senior database architect',
      subTasks: [
        {
          id: '1-1-1',
          title: 'Define product table structure',
          completed: false,
          prompt: 'Design product table with fields for name, description, price, inventory and categories',
          filePaths: ['src/database/productTable.ts'],
          role: 'You\'re a database specialist',
          subTasks: [
            {
              id: '1-1-1-1',
              title: 'Implement product categories hierarchy',
              completed: false,
              prompt: 'Create a self-referential categories table with parent-child relationships',
              filePaths: ['src/database/categoriesTable.ts'],
              role: 'You\'re a database expert',
              subTasks: [
                {
                  id: '1-1-1-1-1',
                  title: 'Add category metadata support',
                  completed: false,
                  prompt: 'Extend categories table to support additional metadata fields like description and icon',
                  filePaths: ['src/database/categoryMetadata.ts'],
                  role: 'You\'re a database designer'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: '1-2',
      title: 'Implement user authentication',
      completed: false,
      prompt: 'Create secure authentication system with JWT tokens, password hashing and session management',
      filePaths: ['src/auth/authService.ts'],
      role: 'You\'re a security engineer'
    },
    {
      id: '1-3',
      title: 'Develop product catalog API',
      completed: false,
      prompt: 'Build RESTful API endpoints for product CRUD operations with pagination and filtering',
      filePaths: ['src/api/products.ts'],
      role: 'You\'re an API developer'
    }
  ]
};

/**
 * Converts an array of ProjectTask or SubTask to an HTML tree string, handling nested subtasks recursively
 * @param tasks Array of ProjectTask or SubTask to convert
 * @returns HTML string representing the tasks as a tree
 */
export function projectTasksToHtml(tasks: (CraftTask | SubTask)[]): string {
  if (!tasks || tasks.length === 0) return '<div>No tasks available</div>';

  const renderTasks = (tasks: (CraftTask | SubTask)[], level = 0): string => {
    if (!tasks || tasks.length === 0) return '';
    
    let ul = '<ul style="list-style-type: none; padding-left: ' + (level * 20) + 'px;">';
    tasks.forEach(task => {
      ul += `<li>
        <div style="font-weight: ${level === 0 ? 'bold' : 'normal'}">
          ${task.title} ${task.completed ? '(Completed)' : ''}
          ${'filePaths' in task && task.filePaths && task.filePaths.length > 0 ? '<br><small style="padding-left: 24px;">' + task.filePaths.map(fp => fp.split('/').pop()).join('<br>') + '</small>' : ''}
        </div>`;
      if (task.subTasks && task.subTasks.length > 0) {
        ul += renderTasks(task.subTasks, level + 1);
      }
      ul += '</li>';
    });
    ul += '</ul>';
    return ul;
  };

  let html = '<div style="font-family: Arial, sans-serif;">';
  html += renderTasks(tasks);
  html += '</div>';
  return html;
}

// File paths referenced in the tasks:
// - src/database/schema.ts
// - src/database/productTable.ts
// - src/database/categoriesTable.ts
// - src/database/categoryMetadata.ts
// - src/auth/authService.ts
// - src/api/products.ts
export async function* executeSubTask(subTask: SubTask): AsyncGenerator<LLMResponse, void, unknown> {
  const llmStream = streamLLMResponse(subTask.role, subTask.prompt);
  
  for await (const chunk of llmStream) {
    yield chunk;  // 持续返回
  }
}

// Note: The above assumes streamLLMResponse$ is a function that takes a prompt and returns a ReadableStream.
// You'll need to replace $ with the actual placeholder value once it's provided.
// Here's the corrected version assuming the placeholder should be 'subTaskPrompt':

// Note: The above assumes streamLLMResponse$ is a function that takes a prompt and returns a ReadableStream.
// You'll need to replace $ with the actual placeholder value once it's provided.
// Here's the corrected version assuming the placeholder should be 'subTaskPrompt':

