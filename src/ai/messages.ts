// 维度: session: user channel agent
import path from "node:path";
import fs from "node:fs/promises";
import { WORKSPACE_ROOT } from "../etc/constants";

export const messages: any[] = [];

export function getMessages(session: {
  userId: string;
  channelId: string;
  agentId: string;
  roomId: string;
}) {
  const sessionDir = path.join(
    process.cwd(),
    WORKSPACE_ROOT,
    // session.agentId,
    "sessions",
    `${session.userId}-${session.channelId}-${session.agentId}-${session.roomId}`,
  );

  return fs
    .readdir(sessionDir)
    .then(async (files) => {
      const sortedFiles = files
        .filter((file) => file.endsWith(".jsonl"))
        .sort((a, b) => b.localeCompare(a));
      const selectedMessages: any[] = [];
      let counted = 0;

      for (const file of sortedFiles) {
        if (counted >= 30) {
          break;
        }

        const sessionPath = path.join(sessionDir, file);
        const data = await fs.readFile(sessionPath, "utf-8").catch(() => "");
        if (!data) {
          continue;
        }

        const messagesInFile = data
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line));

        for (let i = messagesInFile.length - 1; i >= 0; i--) {
          const item = messagesInFile[i];
          selectedMessages.push(item);
          if (
            item?.message?.role === "user" ||
            item?.message?.role === "assistant"
          ) {
            counted += 1;
          }
          if (counted >= 30) {
            break;
          }
        }
      }

      return selectedMessages.reverse();
    })
    .catch(() => []);
}

export async function appendMessage(
  session: {
    userId: string;
    channelId: string;
    agentId: string;
    roomId: string;
  },
  messages: {
    role: string;
    content: any;
    createdAt?: string;
  }[],
) {
  const sessionPath = path.join(
    process.cwd(),
    WORKSPACE_ROOT,
    // session.agentId,
    "sessions",
    `${session.userId}-${session.channelId}-${session.agentId}-${session.roomId}`,
    `${new Date().toISOString().slice(0, 11)}.jsonl`,
  );

  // 没有这个文件 和 目录 就创建
  await fs.mkdir(path.dirname(sessionPath), { recursive: true });

  await fs.access(sessionPath, fs.constants.F_OK).catch(async () => {
    await fs.writeFile(sessionPath, "");
  });

  // 写入文件
  await fs.appendFile(
    sessionPath,
    messages
      .map(
        (message) =>
          JSON.stringify({
            type: "message",
            createdAt: new Date().toISOString(),
            message,
          }) + "\n",
      )
      .join(""),
  );
}

export function clearMessages() {
  //   messages.length = 0;
}

export function editMessage(params) {}
