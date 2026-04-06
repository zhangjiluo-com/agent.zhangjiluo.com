import { tool, ToolLoopAgent } from "ai";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import z from "zod";

const TOOL_WORKSPACE_ROOT = resolve(process.cwd());

function toSafeAbsolutePath(inputPath: string) {
  const resolvedPath = resolve(TOOL_WORKSPACE_ROOT, inputPath);
  // if (
  //   resolvedPath !== TOOL_WORKSPACE_ROOT &&
  //   !resolvedPath.startsWith(`${TOOL_WORKSPACE_ROOT}${sep}`)
  // ) {
  //   throw new Error("Path is outside workspace root");
  // }
  return resolvedPath;
}

const listDirectoryTool = tool({
  description: "List the contents of a directory",
  inputSchema: z.object({
    path: z.string().describe("The path to the directory to list"),
  }),
  async execute(input) {
    const targetPath = toSafeAbsolutePath(input.path || ".");
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

const readFileAsTextTool = tool({
  description: "Read a file as text content",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to read"),
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
      const targetPath = toSafeAbsolutePath(input.path);
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

const writeTextFileTool = tool({
  description:
    "Write text content to a file, file will be created if it doesn't exist",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to write"),
    content: z.string().describe("The content to write to the file"),
  }),
  async execute(input) {
    const targetPath = toSafeAbsolutePath(input.path);
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

export const tools = {
  list_directory: listDirectoryTool,
  read_file: readFileAsTextTool,
  write_file: writeTextFileTool,
};
