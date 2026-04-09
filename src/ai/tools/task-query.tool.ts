import { tool } from "ai";

import z from "zod";

// 任务查询工具 主要给主 Agent 调用
export const taskQueryTool = tool({
  description: `Query system agent async task by id.`,
  inputSchema: z.object({
    taskId: z.string().trim().describe("Task id"),
  }),
  async execute(input) {
    return {
      result: "success",
    };
  },
});
