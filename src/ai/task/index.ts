import { randomUUID } from "crypto";
import { event } from "../../gateway/event";
import {
  EVENT_ID_AI_TASK_ADD,
  EVENT_ID_AI_TASK_END,
} from "../../etc/constants";

interface Task {
  id: string;
  name: string;
  description: string;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "running"
    | "completed"
    | "failed";
  messages: any[];
  report?: string; // 完成时的简单描述
  reason?: string; // 失败时的详细描述
  context: unknown; // 任务上下文
}
const taskList: Task[] = [];

export function addTask(
  input: { name: string; description: string },
  context: unknown,
) {
  // 检查任务描述是否为空
  if (!input.description.trim()) {
    throw new Error("任务描述不能为空");
  }
  const id = randomUUID();
  taskList.push({
    id,
    name: input.name,
    description: input.description,
    status: "pending",
    messages: [],
    context,
  });
  event.emit(EVENT_ID_AI_TASK_ADD, { id });
  return id;
}

export function getTaskList() {
  return taskList;
}

export function getTaskById(id: string): Task | undefined {
  const task = taskList.find((t) => t.id === id);
  return task;
}

export function writeTaskMessage(id: string, messages: unknown[]) {
  const task = getTaskById(id);
  if (!task) {
    throw new Error(`任务 ${id} 不存在`);
  }
  task.messages.push(...messages);
}

export function getTaskMessages(id: string) {
  const task = getTaskById(id);
  if (!task) {
    throw new Error(`任务 ${id} 不存在`);
  }
  return task.messages;
}

export function endTask(input: {
  taskId: string;
  isCompleted: boolean;
  result: string;
}) {
  const task = getTaskById(input.taskId);
  if (!task) {
    throw new Error(`任务 ${input.taskId} 不存在`);
  }
  task.status = input.isCompleted ? "completed" : "failed";
  if (input.isCompleted) {
    task.report = input.result;
  } else {
    task.reason = input.result;
  }
  event.emit(EVENT_ID_AI_TASK_END, { id: task.id });
}

export function submitTask(input: { taskId: string; report: string }) {
  const task = getTaskById(input.taskId);
  if (!task) {
    throw new Error(`Task not found (ID: ${input.taskId})`);
  }
  task.status = "completed";
  task.report = input.report;
  event.emit(EVENT_ID_AI_TASK_END, { id: task.id });
}

export function failTask(input: { taskId: string; reason: string }) {
  const task = getTaskById(input.taskId);
  if (!task) {
    throw new Error(`Task not found (ID: ${input.taskId})`);
  }
  task.status = "failed";
  task.reason = input.reason;
  event.emit(EVENT_ID_AI_TASK_END, { id: task.id });
}
