import { tool } from "ai";
import z from "zod";

// 任务列表工具 主要给主 Agent 调用
export const taskListTool = tool({
  description: `List all system agent async tasks.`,
  inputSchema: z.object({
    includeEnded: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to include ended(completed/failed) tasks"),
  }),
  async execute(input) {
    return {
      result: "success",
    };
  },
});
