import type { LLMResponse } from "../../llm";
import { executeSubTask, type CraftTask, type SubTask } from "./CraftTask";

export class ProjectTaskManager {
  private taskStack: { taskId: string; index: number }[] = [];
  private taskMap = new Map<string, CraftTask | SubTask>();

  constructor(projectTask: CraftTask) {
    this.buildTaskMap(projectTask);
    this.taskStack.push({ taskId: projectTask.id, index: 0 });
  }

  private buildTaskMap(task: CraftTask | SubTask): void {
    this.taskMap.set(task.id, task);
    if (task.subTasks) {
      for (const sub of task.subTasks) {
        this.buildTaskMap(sub);
      }
    }
  }

  /**
   * 设置当前任务的 toolCalls
   * @param toolCalls 要设置的 toolCalls 数组
   */
  public setCurrentToolCalls(toolCalls: any[]): void {
    const currentTask = this.getNextTaskInfo();
    if (currentTask) {
      currentTask.toolCalls = toolCalls;
    }
  }

  /**
   * 执行下一个子任务，返回 LLM 响应流
   */
  public async *executeNext(): AsyncGenerator<LLMResponse, void, unknown> {
    while (this.taskStack.length > 0) {
      const { taskId, index } = this.taskStack[this.taskStack.length - 1];
      const task = this.taskMap.get(taskId);

      if (!task || !task.subTasks || index >= task.subTasks.length) {
        this.taskStack.pop();
        continue;
      }

      const subTask = task.subTasks[index];

      // 如果还有子任务，先推进子任务
      if (subTask.subTasks && subTask.subTasks.length > 0) {
        this.taskStack.push({ taskId: subTask.id, index: 0 });
        continue;
      }

      // 是叶子任务，就执行它
      for await (const chunk of executeSubTask(subTask)) {
        yield chunk;
      }

      // 执行完后更新 index
      this.taskStack[this.taskStack.length - 1].index++;
      return;
    }
  }

  /**
   * 一次性执行所有任务，返回完整 LLM 响应流
   */
  public async *executeAll(): AsyncGenerator<LLMResponse, void, unknown> {
    while (true) {
      const next = this.executeNext();
      let done = false;
      for await (const chunk of next) {
        yield chunk;
        done = false;
      }

      // 如果 executeNext 没 yield 任何东西，说明结束了
      if (this.taskStack.length === 0) {
        break;
      }
    }
  }

  /**
   * 获取下一个应该执行的任务信息，不修改任务状态
   * @returns 下一个子任务或null（如果没有更多任务）
   */
  public getNextTaskInfo(): SubTask | null {
  // 克隆栈副本
  const stackCopy = [...this.taskStack];

  while (stackCopy.length > 0) {
    const { taskId, index } = stackCopy[stackCopy.length - 1];
    const task = this.taskMap.get(taskId);

    if (!task || !task.subTasks || index >= task.subTasks.length) {
      stackCopy.pop(); // 只修改副本
      continue;
    }

    const subTask = task.subTasks[index];

    // 如果这个 subTask 还有子任务，向下钻一层继续模拟
    if (subTask.subTasks && subTask.subTasks.length > 0) {
      stackCopy.push({ taskId: subTask.id, index: 0 });
      continue;
    }

    // 找到下一个实际要执行的任务
    return subTask;
  }

  return null; // 没有更多任务
}

}

