// 任务结束工具 主要给任务执行 Agent 调用

import { tool } from "ai";
import { endTask, submitTask } from "../task";
import z from "zod";
import { getErrorForAi } from "../../utils/get-error-for-ai";

export const taskSubmitTool = tool({
  description: `Submit current target task if it is completed`,
  inputSchema: z.object({
    report: z
      .string()
      .trim()
      .describe("Report the result of the task concisely."),
  }),
  async execute(input, context) {
    try {
      submitTask({
        // experimental_context 这里放 当前目标 task 对象
        taskId: (context.experimental_context as any).id,
        report: input.report,
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
