import { tool, type ToolSet } from "ai";
import { getMcpTools } from "./mcp";
import { shellCommandTool } from "./shell-command.tool";
import { taskAddTool } from "./task-add.tool";
import { taskFailTool } from "./task-fail.tool";
import { taskSubmitTool } from "./task-submit.tool";

export async function getAssistantTools(): Promise<ToolSet> {
  return {
    task_add: taskAddTool,
    // ...(await getMcpTools()),
  };
}

export async function getAsyncTaskTools(): Promise<ToolSet> {
  return {
    command: shellCommandTool,
    task_fail: taskFailTool,
    task_submit: taskSubmitTool,
    ...(await getMcpTools()),
  };
}
