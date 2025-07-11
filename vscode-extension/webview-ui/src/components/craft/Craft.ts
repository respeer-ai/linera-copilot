import type { LLMResponse } from '../../llm';
import { executeSubTask, type CraftTask, type SubTask } from './CraftTask';

export class ProjectTaskManager {
    private currentTaskIndex: number = 0;
    private currentSubTaskIndex: number = 0;
    private projectTask: CraftTask;

    constructor(projectTask: CraftTask) {
        this.projectTask = projectTask;
    }

    /**
     * Executes the next subtask in the current task.
     * If current task is completed, moves to the next task.
     */
    public async *executeNext(): AsyncGenerator<LLMResponse, void, unknown> {
      while (this.currentTaskIndex < this.projectTask.subTasks.length) {
        const currentTask = this.projectTask.subTasks[this.currentTaskIndex];

        while (currentTask.subTasks && this.currentSubTaskIndex < currentTask.subTasks.length) {
          const subTask = currentTask.subTasks[this.currentSubTaskIndex];

          // 执行子任务，yield其每个响应
          for await (const chunk of executeSubTask(subTask)) {
            yield chunk;
          }

          this.currentSubTaskIndex++;
        }

        // 当前 task 执行完，进入下一个 task
        this.currentTaskIndex++;
        this.currentSubTaskIndex = 0;
      }

      // 所有任务全部完成，生成器自然结束
    }


    /**
     * Gets information about the next subtask to be executed.
     */
    public getNextTaskInfo(): SubTask | null | undefined {
        if (this.currentTaskIndex >= this.projectTask.subTasks.length) {
            return null; // No more tasks
        }

        const currentTask = this.projectTask.subTasks[this.currentTaskIndex];
        if (currentTask.subTasks && this.currentSubTaskIndex < currentTask.subTasks.length) {
            return currentTask.subTasks?.[this.currentSubTaskIndex];
        } else {
            // Current task completed, next is first subtask of next task
            if (this.currentTaskIndex + 1 < this.projectTask.subTasks.length) {
                return this.projectTask.subTasks?.[this.currentTaskIndex + 1].subTasks?.[0];
            } else {
                return null; // No more subtasks
            }
        }
    }
}
