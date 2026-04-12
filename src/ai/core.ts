import { event } from "../gateway/event";
import { chat } from "../llm";
import { getAssistantTools } from "./tools";
import { appendMessage, getMessages } from "./messages";
import {
  EVENT_ID_AI_SEND_MESSAGE_TO_USER,
  EVENT_ID_AI_TASK_END,
} from "../etc/constants";
import { EVENT_ID_USER_CHAT_SEND_MESSAGE } from "../etc/constants";
import { getTaskById } from "./task";
import { log } from "../etc/log";

const BASE_SYSTEM_PROMPT = `You are a assistant. Respond in the same language the user uses.
`;

/**
 * 1. 处理消息 生成上下文 短期记忆
 * 2. 调用工具
 * 3. 调用模型
 * 4. 加载用户配置
 * 5. 加载agent 配置
 * 6.
 * 7. 组装 系统提示词 宪章 长期记忆
 */
async function handleUserChatSendMessage(msg: {
  message: string; // 暂时就文本消息
  userId: string;
  channelType: string;
  channelId: string;
  roomId: string;
  agentId: string;
  timestamp: number;
}) {
  await appendMessage(
    {
      userId: msg.userId,
      channelId: msg.channelId,
      agentId: msg.agentId,
      roomId: msg.roomId,
    },
    [
      {
        role: "user",
        content: msg.message,
      },
    ],
  );

  const messageList = await getMessages({
    userId: msg.userId,
    channelId: msg.channelId,
    agentId: msg.agentId,
    roomId: msg.roomId,
  });
  const tools = await getAssistantTools();

  const res = await chat({
    system: BASE_SYSTEM_PROMPT,
    messages: messageList.map((item) => item.message),
    maxOutputTokens: 4096,
    model: "claude-opus-4-5",
    tools: tools,
    experimental_context: msg,
  });

  await appendMessage(
    {
      userId: msg.userId,
      channelId: msg.channelId,
      agentId: msg.agentId,
      roomId: msg.roomId,
    },
    res.response.messages,
  );

  event.emit(EVENT_ID_AI_SEND_MESSAGE_TO_USER, {
    userId: msg.userId,
    channelType: msg.channelType,
    channelId: msg.channelId,
    agentId: msg.agentId,
    roomId: msg.roomId,
    content: { type: "text", text: res.text },
    origin: msg,
  });
}

async function handleTaskEnd(params: { id: string }) {
  const task = getTaskById(params.id);
  if (!task) {
    log.e("Task not found", params.id);
    return;
  }

  const context = task.context as {
    userId: string;
    channelType: string;
    channelId: string;
    roomId: string;
    agentId: string;
    timestamp: number;
  };

  await handleUserChatSendMessage({
    userId: context.userId,
    channelType: context.channelType,
    channelId: context.channelId,
    roomId: context.roomId,
    agentId: context.agentId,
    timestamp: context.timestamp,
    message: `Task [${task.name}](${task.id}) ${task.status}: ${task.report || task.reason || ""}`,
  });
}

export function linsten() {
  event.on(EVENT_ID_USER_CHAT_SEND_MESSAGE, handleUserChatSendMessage);
  event.on(EVENT_ID_AI_TASK_END, handleTaskEnd);
}
