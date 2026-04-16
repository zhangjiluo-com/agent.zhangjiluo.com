import { tool } from "ai";
import { readFile } from "fs/promises";
import { resolve } from "path";
import z from "zod";

export const fileReadTool = tool({
  description: "Read a file as text content",
  inputSchema: z.object({
    path: z.string().trim().min(1).describe("The path to the file to read"),
    startChar: z
      .number()
      .int()
      .min(0)
      .describe("The start position (character index) to read from")
      .optional()
      .default(0),
    maxChars: z
      .number()
      .int()
      .min(1)
      .max(200000)
      .describe("The maximum number of characters to read")
      .optional()
      .default(5000),
  }),
  async execute(input) {
    try {
      const targetPath = resolve(process.cwd(), input.path);
      const text = await readFile(targetPath, "utf8");
      const endChar = input.startChar + input.maxChars;
      return {
        result: "success",
        path: targetPath,
        content: text.slice(input.startChar, endChar),
        startChar: input.startChar,
        truncated: text.length > endChar,
        totalChars: text.length,
      };
    } catch (error) {
      return {
        result: "failed",
        path: input.path,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
