import { tool } from "ai";
import { readdir } from "fs/promises";
import { resolve } from "path";
import z from "zod";

export const fileDirectoryListTool = tool({
  description: "List the contents of a directory",
  inputSchema: z.object({
    path: z
      .string()
      .trim()
      .min(1)
      .describe("The path to the directory to list"),
  }),
  async execute(input) {
    const targetPath = resolve(process.cwd(), input.path);
    const entries = await readdir(targetPath, { withFileTypes: true });
    return {
      path: targetPath,
      entries: entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory()
          ? "directory"
          : entry.isFile()
            ? "file"
            : "unknown",
      })),
    };
  },
});
