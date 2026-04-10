import { event } from "../../gateway/event";
import { chat } from "../../llm";
import { commandTool, taskResultSubmitTool, tools } from "../tools";
import { appendMessage, getMessages } from "../messages";
import {
  EVENT_ID_AI_SEND_MESSAGE_TO_USER,
  EVENT_ID_AI_TASK_ADD,
  EVENT_ID_USER_CHAT_SEND_MESSAGE,
} from "../../etc/constants";
import { getTaskById, getTaskMessages, writeTaskMessage } from ".";
import { log } from "../../etc/log";

const BASE_SYSTEM_PROMPT = `You are a helpful assistant. Complete the task as soon as possible.
You run on windows 11 and can access whole computer.
If the task completed or failed, you should submit a report or failed reason to the task system.
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
async function handleTaskAdd(taskBase: { id }) {
  const task = getTaskById(taskBase.id);
  if (!task) {
    log.e(`task not found ${taskBase.id}`);
    return;
  }
  const description = task.description;

  await writeTaskMessage(task.id, [
    {
      role: "user",
      content: description,
    },
  ]);
  const messageList = await getTaskMessages(task.id);
  const res = await chat({
    system: BASE_SYSTEM_PROMPT,
    messages: messageList,
    maxOutputTokens: 4096,
    model: "claude-opus-4-5",
    tools: {
      command: commandTool,
      task_result_submit: taskResultSubmitTool,
    },
    experimental_context: task,
  });
  await writeTaskMessage(task.id, res.response.messages);

  // event.emit(EVENT_ID_AI_SEND_MESSAGE_TO_USER, {
  //   userId: msg.userId,
  //   channelType: msg.channelType,
  //   channelId: msg.channelId,
  //   agentId: msg.agentId,
  //   roomId: msg.roomId,
  //   content: { type: "text", text: res.text },
  //   origin: msg,
  // });
}

export function asyncTaskAgentLinsten() {
  event.on(EVENT_ID_AI_TASK_ADD, handleTaskAdd);
}
