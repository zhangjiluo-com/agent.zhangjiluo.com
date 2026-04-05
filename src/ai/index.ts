import Anthropic from "@anthropic-ai/sdk";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { event } from "../gateway/event";
import { chat } from "../llm";

const BASE_SYSTEM_PROMPT =
  "You are a helpful assistant. Respond in the same language the user uses.";

// async function findClaudeSkillFiles(dir: string): Promise<string[]> {
//   const files: string[] = [];
//   let entries;

//   try {
//     entries = await readdir(dir, { withFileTypes: true });
//   } catch {
//     return files;
//   }

//   for (const entry of entries) {
//     const fullPath = join(dir, entry.name);
//     if (entry.isDirectory()) {
//       files.push(...(await findClaudeSkillFiles(fullPath)));
//       continue;
//     }
//     if (entry.isFile() && entry.name === "SKILL.md") {
//       files.push(fullPath);
//     }
//   }

//   return files;
// }

// function readFrontmatterName(content: string) {
//   const match = content.match(
//     /^---\s*[\r\n]+[\s\S]*?^name:\s*["']?([^"'\r\n]+)["']?/m,
//   );
//   return match?.[1]?.trim();
// }

// async function loadClaudeCodeSkills() {
//   const skillRoots = [
//     join(process.cwd(), ".claude", "skills"),
//     join(homedir(), ".claude", "skills"),
//   ];
//   const allSkillFiles = (
//     await Promise.all(skillRoots.map((root) => findClaudeSkillFiles(root)))
//   ).flat();
//   const uniqueSkillFiles = Array.from(new Set(allSkillFiles)).sort();

//   const skills = await Promise.all(
//     uniqueSkillFiles.map(async (filePath) => {
//       const content = await readFile(filePath, "utf8");
//       return {
//         name: readFrontmatterName(content) || basename(filePath, ".md"),
//         filePath,
//         content: content.trim(),
//       };
//     }),
//   );

//   return skills;
// }

// async function buildSystemPrompt() {
//   const skills = await loadClaudeCodeSkills();
//   if (!skills.length) {
//     return BASE_SYSTEM_PROMPT;
//   }

//   const skillSection = skills
//     .map(
//       (skill, index) =>
//         `## Skill ${index + 1}: ${skill.name}\nSource: ${skill.filePath}\n${skill.content}`,
//     )
//     .join("\n\n");

//   return `${BASE_SYSTEM_PROMPT}

// You can use the following Claude Code skills as additional operating guidance. Use each skill only when the user request matches its purpose.

// ${skillSection}`;
// }

// async function nativeChat(msg: string) {
//   // const systemPrompt = await buildSystemPrompt();
//   const client = new Anthropic({
//     apiKey:
//       "sk-kimi-ytzFgV7zkUHJ1YSfPedv5YV639tIaZFmmHtcAMYFP1BMHkawXmYHYoNrPc3wseU8",
//     baseURL: "https://api.kimi.com/coding/",
//   });

//   return client.messages.create({
//     model: "claude-opus-4-5",
//     max_tokens: 4096,
//     system: BASE_SYSTEM_PROMPT,
//     messages: [
//       {
//         role: "user",
//         content: msg,
//       },
//     ],
//   });
// }

// export async function chat(msg: string) {
//   // const res1 = await nativeChat(msg);
//   // event.emit("llmResponse", res1);
//   // return;
//   // const res = await generateText({
//   //   model: createAnthropic({
//   //     apiKey:
//   //       "sk-kimi-ytzFgV7zkUHJ1YSfPedv5YV639tIaZFmmHtcAMYFP1BMHkawXmYHYoNrPc3wseU8",
//   //     baseURL: "https://api.kimi.com/coding/v1/",
//   //   })("claude-opus-4-5"),
//   //   maxOutputTokens: 4096,
//   //   system: BASE_SYSTEM_PROMPT,
//   //   messages: [
//   //     {
//   //       role: "user",
//   //       content: msg,
//   //     },
//   //   ],
//   // });
//   // event.emit("llmResponse", res);
// }

const messages: any[] = [];

function addMessage(msg: any) {
  messages.push(msg);
}

async function handleChat(msg: {
  message: string; // 暂时就文本消息
  userId: string;
  roomId: string;
  timestamp: number;
  channelId: string;
}) {
  console.log(msg);
  addMessage({
    role: "user",
    content: msg.message,
  });

  const res = await chat({
    systemPrompt: BASE_SYSTEM_PROMPT,
    messages: messages,
    maxResponseTokens: 4096,
    model: "claude-opus-4-5",
  });

  let fullText = "";
  try {
    for (let index = 0; index < res.content.length; index++) {
      const element = res.content[index];
      // process.stdout.write(c(element.text, C.white));
      if (element.type === "text") {
        fullText += element.text;
      } else {
        console.log("其他类型", element);
      }
    }
    event.emit("aiResponse", { content: { type: "text", text: fullText } });
    addMessage({
      role: "assistant",
      content: fullText,
    });
  } catch (error) {
    console.error(error);
  }
}

export function runAI() {
  event.on("sendMessage", handleChat);
}
