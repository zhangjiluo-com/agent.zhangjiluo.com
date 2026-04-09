import { tool } from "ai";

import z from "zod";

// 任务操作工具 主要给主 Agent 调用
export const taskOperateTool = tool({
  description: `Operate system agent async tasks.`,
  inputSchema: z.object({
    taskId: z.string().trim().describe("The task id"),
    operate: z
      .string()
      //   .enum(["complete", "fail"])
      .describe("The operate to do"),
  }),
  async execute(input) {
    return {
      result: "success",
    };
  },
});
