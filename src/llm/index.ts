import {
  generateText,
  ModelMessage,
  stepCountIs,
  ToolSet,
  wrapLanguageModel,
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { devToolsMiddleware } from "@ai-sdk/devtools";

// const TOOL_WORKSPACE_ROOT = resolve(process.cwd());

type LLMChatData = {
  system: string;
  messages: ModelMessage[];
  maxOutputTokens: number;
  model: string;
  tools?: ToolSet;
};

// export async function chat1(msg: LLMChatData) {
//   const client = new Anthropic({
//     apiKey:
//       "sk-kimi-ytzFgV7zkUHJ1YSfPedv5YV639tIaZFmmHtcAMYFP1BMHkawXmYHYoNrPc3wseU8",
//     baseURL: "https://api.kimi.com/coding/",
//   });

//   const workingMessages = [...msg.messages];
//   const tools: Anthropic.Tool[] = [
//     {
//       name: "list_directory",
//       description:
//         "List files and folders under a workspace path. Use relative paths like '.', 'src', 'src/ai'.",
//       input_schema: {
//         type: "object",
//         properties: {
//           path: { type: "string" },
//         },
//       },
//     },
//     {
//       name: "read_file",
//       description: "Read UTF-8 text file content from workspace path.",
//       input_schema: {
//         type: "object",
//         properties: {
//           path: { type: "string" },
//           maxChars: { type: "number" },
//         },
//         required: ["path"],
//       },
//     },
//     {
//       name: "write_file",
//       description:
//         "Write UTF-8 text content to a workspace file path. Creates parent directories by default.",
//       input_schema: {
//         type: "object",
//         properties: {
//           path: { type: "string" },
//           content: { type: "string" },
//           createDirs: { type: "boolean" },
//         },
//         required: ["path", "content"],
//       },
//     },
//   ];

//   while (true) {
//     const res = await client.messages.create({
//       model: msg.model,
//       messages: workingMessages,
//       system: msg.system,
//       max_tokens: msg.maxOutputTokens,
//       tools,
//     });

//     const toolCalls = res.content.filter((item) => item.type === "tool_use");
//     if (!toolCalls.length) {
//       event.emit(EVENT_ID_LLM_RESPONSE, res);
//       return res;
//     }

//     workingMessages.push({
//       role: "assistant",
//       content: res.content,
//     });

//     const toolResults = [];
//     for (const call of toolCalls) {
//       try {
//         const output = await executeTool(call.name, call.input);
//         toolResults.push({
//           type: "tool_result",
//           tool_use_id: call.id,
//           content: JSON.stringify(output),
//         });
//       } catch (error: any) {
//         toolResults.push({
//           type: "tool_result",
//           tool_use_id: call.id,
//           content: error?.message || "Tool execution failed",
//           is_error: true,
//         });
//       }
//     }

//     workingMessages.push({
//       role: "user",
//       content: toolResults,
//     });
//   }
// }

export async function chat(msg: LLMChatData) {
  const res = await generateText({
    ...msg,
    stopWhen: stepCountIs(30),
    model: wrapLanguageModel({
      model: createAnthropic({
        apiKey:
          "sk-kimi-ytzFgV7zkUHJ1YSfPedv5YV639tIaZFmmHtcAMYFP1BMHkawXmYHYoNrPc3wseU8",
        baseURL: "https://api.kimi.com/coding/v1/",
      })("claude-opus-4-5"),
      middleware: devToolsMiddleware(),
    }),
    onStepFinish: (step) => {},
    onFinish: (step) => {},
  });

  return res;
}

// export async function streamChat(msg: string) {}
