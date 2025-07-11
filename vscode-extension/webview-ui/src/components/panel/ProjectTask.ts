export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  subTasks?: SubTask[]; // Allow nested subtasks
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  subTasks: SubTask[];
}

export const exampleTask = {
  id: '1',
  title: 'Create a 2048 game',
  completed: false,
  subTasks: [
    {
      id: '1-1',
      title: 'Implement game board',
      completed: false,
      subTasks: [
        {
          id: '1-1-1',
          title: 'Create grid structure',
          completed: false,
          subTasks: [
            {
              id: '1-1-1-1',
              title: 'Set up CSS grid',
              completed: false
            },
            {
              id: '1-1-1-2',
              title: 'Implement cell rendering',
              completed: false
            }
          ]
        },
        {
          id: '1-1-2',
          title: 'Add touch/mouse controls',
          completed: false
        }
      ]
    },
    {
      id: '1-2',
      title: 'Add tile sliding logic',
      completed: false
    },
    {
      id: '1-3',
      title: 'Implement score tracking',
      completed: false
    }
  ]
};

/**
 * Converts an array of ProjectTask or SubTask to an HTML tree string, handling nested subtasks recursively
 * @param tasks Array of ProjectTask or SubTask to convert
 * @returns HTML string representing the tasks as a tree
 */
export function projectTasksToHtml(tasks: (ProjectTask | SubTask)[]): string {
  if (!tasks || tasks.length === 0) return '<div>No tasks available</div>';

  const renderTasks = (tasks: (ProjectTask | SubTask)[], level = 0): string => {
    if (!tasks || tasks.length === 0) return '';
    
    let ul = '<ul style="list-style-type: none; padding-left: ' + (level * 20) + 'px;">';
    tasks.forEach(task => {
      ul += `<li>
        <div style="font-weight: ${level === 0 ? 'bold' : 'normal'}">
          ${task.title} ${task.completed ? '(Completed)' : ''}
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
