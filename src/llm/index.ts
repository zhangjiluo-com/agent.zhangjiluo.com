import Anthropic from "@anthropic-ai/sdk";
import { event } from "../gateway/event";
import { EVENT_ID_LLM_RESPONSE } from "../etc/constants";

const BASE_SYSTEM_PROMPT =
  "You are a helpful assistant. Respond in the same language the user uses.";

type LLMChatData = {
  systemPrompt: string;
  messages: any[];
  maxResponseTokens: number;
  model: string;
};

export async function chat(msg: LLMChatData) {
  const client = new Anthropic({
    apiKey:
      "sk-kimi-ytzFgV7zkUHJ1YSfPedv5YV639tIaZFmmHtcAMYFP1BMHkawXmYHYoNrPc3wseU8",
    baseURL: "https://api.kimi.com/coding/",
  });

  const res = await client.messages.create({
    model: msg.model,
    messages: msg.messages,
    system: msg.systemPrompt,
    max_tokens: msg.maxResponseTokens,
    // model: "claude-opus-4-5",
    // system: BASE_SYSTEM_PROMPT,
    // messages: [
    //   {
    //     role: "user",
    //     content: msg,
    //   },
    // ],
  });

  event.emit(EVENT_ID_LLM_RESPONSE, res);

  return res;
}

// export async function streamChat(msg: string) {}
