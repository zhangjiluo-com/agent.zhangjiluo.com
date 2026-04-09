import { event } from "../gateway/event";
import { chat } from "../llm";
import { tools } from "./tools";
import { appendMessage, getMessages } from "./messages";
import { EVENT_ID_AI_SEND_MESSAGE_TO_USER } from "../etc/constants";
import { EVENT_ID_USER_CHAT_SEND_MESSAGE } from "../etc/constants";

const BASE_SYSTEM_PROMPT = `You are a helpful assistant. Respond in the same language the user uses.
You run on windows 11 and can access whole computer. Current time is ${new Date().toLocaleString()}.
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

  const res = await chat({
    system: BASE_SYSTEM_PROMPT,
    messages: messageList.map((item) => item.message),
    maxOutputTokens: 4096,
    model: "claude-opus-4-5",
    tools: tools,
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

export function linsten() {
  event.on(EVENT_ID_USER_CHAT_SEND_MESSAGE, handleUserChatSendMessage);
}
