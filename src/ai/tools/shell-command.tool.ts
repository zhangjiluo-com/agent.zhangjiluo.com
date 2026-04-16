import { tool } from "ai";
import z from "zod";
import { log } from "../../etc/log";
import { promisify } from "node:util";
import { exec } from "node:child_process";

export const shellCommandTool = tool({
  description: "Run a shell command on the system by node child_process.exec",
  inputSchema: z.object({
    command: z.string().trim().describe("The command to run"),
  }),
  async execute(input) {
    const startTime = Date.now();
    log.i("即将执行命令", input);
    try {
      const { stdout, stderr } = await promisify(exec)(input.command, {
        // timeout: 10_000,
        encoding: "utf-8",
      });
      log.i("执行命令耗时:", Math.floor((Date.now() - startTime) / 1000), "秒");
      return {
        result: "success",
        command: input.command,
        stdout,
        stderr,
      };
    } catch (e: any) {
      log.e(
        "执行命令失败:",
        e,
        "耗时:",
        Math.floor((Date.now() - startTime) / 1000),
        "秒",
      );
      return {
        result: "failed",
        command: input.command,
        stdout: (e.stdout || "").substring(0, 2000),
        stderr: (e.stderr || e.message).substring(0, 2000),
        exit_code: e.status ?? 1,
      };
    }
  },
});
