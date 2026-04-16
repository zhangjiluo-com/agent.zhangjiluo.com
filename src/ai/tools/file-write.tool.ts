import { tool } from "ai";
import { mkdir, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import z from "zod";

export const fileWriteTool = tool({
  description:
    "Write text content to a file, file will be created if it doesn't exist",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to write"),
    content: z.string().describe("The content to write to the file"),
  }),
  async execute(input) {
    const targetPath = resolve(process.cwd(), input.path);
    try {
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, input.content, "utf8");
      return {
        result: "success",
        path: targetPath,
      };
    } catch (error) {
      return {
        result: "failed",
        path: targetPath,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
