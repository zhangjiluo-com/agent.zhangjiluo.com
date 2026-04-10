// 任务结束工具 主要给任务执行 Agent 调用

import { tool } from "ai";
import { endTask, failTask, submitTask } from "../task";
import z from "zod";
import { getErrorForAi } from "../../utils/get-error-for-ai";

export const taskFailTool = tool({
  description: `End current target task as failed`,
  inputSchema: z.object({
    reason: z.string().trim().describe("The task failed reason"),
  }),
  async execute(input, context) {
    try {
      failTask({
        // experimental_context 这里放 当前目标 task 对象
        taskId: (context.experimental_context as any).id,
        reason: input.reason,
      });
      return { result: "success" };
    } catch (error) {
      return {
        result: "failed",
        reason: getErrorForAi(error),
      };
    }
  },
});
