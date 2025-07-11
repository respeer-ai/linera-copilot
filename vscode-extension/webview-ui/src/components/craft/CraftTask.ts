import { streamLLMResponse, type LLMResponse } from "../../llm";

export interface FileOperation {
  type: 'create' | 'modify' | 'delete' | 'move';
  sourcePath: string;
  targetPath?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  fileOperations: FileOperation[];
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
  title: 'Implement e-commerce platform',
  completed: false,
  subTasks: [
    {
      id: '1-1',
      title: 'Setup backend services',
      completed: false,
      prompt: 'Create REST API for product management',
      fileOperations: [
        { type: 'create', sourcePath: 'src/api/products.ts', targetPath: '' },
        { type: 'modify', sourcePath: 'src/database/schema.ts', targetPath: '' }
      ],
      role: 'You\'re a backend developer',
      subTasks: [
        {
          id: '1-1-1',
          title: 'Product CRUD endpoints',
          completed: false,
          prompt: 'Implement create, read, update, delete endpoints for products',
          fileOperations: [
            { type: 'create', sourcePath: 'src/api/productCrud.ts', targetPath: '' }
          ],
          role: 'You\'re an API engineer',
          subTasks: [
            {
              id: '1-1-1-1',
              title: 'Database schema update',
              completed: false,
              prompt: 'Add new fields to product table schema',
              fileOperations: [
                { type: 'modify', sourcePath: 'src/database/productTable.ts', targetPath: '' }
              ],
              role: 'You\'re a database architect',
              subTasks: [
                {
                  id: '1-1-1-1-1',
                  title: 'Add category reference',
                  completed: false,
                  prompt: 'Add foreign key to categories table in product schema',
                  fileOperations: [
                    { type: 'modify', sourcePath: 'src/database/productTable.ts', targetPath: '' },
                    { type: 'modify', sourcePath: 'src/database/categoriesTable.ts', targetPath: '' }
                  ],
                  role: 'You\'re a database designer',
                  subTasks: []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: '1-2',
      title: 'Create frontend components',
      completed: false,
      prompt: 'Develop React components for product listing',
      fileOperations: [
        { type: 'create', sourcePath: 'src/ui/ProductList.tsx', targetPath: '' }
      ],
      role: 'You\'re a frontend developer',
      subTasks: []
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
          ${'fileOperations' in task && task.fileOperations && task.fileOperations.length > 0 ? '<br><small><div style="padding-left: 24px;">' + task.fileOperations.map(op => 
            `<div>${op.type} ${op.sourcePath}${op.targetPath ? ' -> ' + op.targetPath : ''}</div>`
          ).join('') + '</div></small>' : ''}
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

