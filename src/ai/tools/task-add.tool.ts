import { tool } from "ai";
import z from "zod";
import { addTask } from "../task";
import { shellCommandTool } from "./shell-command.tool";

// 任务添加工具 主要给主 Agent 调用

export const taskAddTool = tool({
  description: `Add an async task to system.
  The async agent can use below tools to complete the task:

  - **command**: ${shellCommandTool.description}
  
  If the task cannot be completed using the above tools, do not use this tool.
  Once the task end, system will notify the you as user message.
  Once task submit success, you can tell user.
`,
  inputSchema: z.object({
    name: z.string().trim().describe("The name of the task"),
    description: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .describe(
        "The description of the task, along with sufficient and accurate context",
      ),
  }),
  async execute(input, context) {
    try {
      if (!context.experimental_context) {
        return {
          result: "failed",
          reason: "系统异常, 无法派发任务",
        };
      }
      const taskId = addTask(input, context.experimental_context);
      return {
        result: "success",
        taskId,
      };
    } catch (error) {
      return {
        result: "failed",
        // task: input.task,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
