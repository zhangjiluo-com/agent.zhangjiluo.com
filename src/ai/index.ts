import Anthropic from "@anthropic-ai/sdk";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { event } from "../gateway/event";

function nativeChat(msg: string) {
  const client = new Anthropic({
    apiKey:
      "sk-kimi-ytzFgV7zkUHJ1YSfPedv5YV639tIaZFmmHtcAMYFP1BMHkawXmYHYoNrPc3wseU8",
    baseURL: "https://api.kimi.com/coding/",
  });

  return client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system:
      "You are a helpful assistant. Respond in the same language the user uses.",
    messages: [
      {
        role: "user",
        content: msg,
      },
    ],
  });
}

export async function chat(msg: string) {
  const res1 = await nativeChat(msg);

  event.emit("llmResponse", res1);
  return;
  const res = await generateText({
    model: createAnthropic({
      apiKey:
        "sk-kimi-ytzFgV7zkUHJ1YSfPedv5YV639tIaZFmmHtcAMYFP1BMHkawXmYHYoNrPc3wseU8",
      baseURL: "https://api.kimi.com/coding/v1/",
    })("claude-opus-4-5"),
    maxOutputTokens: 4096,
    system:
      "You are a helpful assistant. Respond in the same language the user uses.",
    messages: [
      {
        role: "user",
        content: msg,
      },
    ],
  });
  event.emit("llmResponse", res);
}

function handleChat(msg: {
  message: string; // 暂时就文本消息
  userId: string;
  roomId: string;
  timestamp: number;
  channelId: string;
}) {
  console.log(msg);
  chat(msg.message);
}

export function runAI() {
  event.on("sendMessage", handleChat);
}
