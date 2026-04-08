import { log } from "../etc/log";

import http from "http";
import { WebSocketServer } from "ws";
import { runAI } from "../ai";
import { event } from "./event";
import {
  EVENT_ID_USER_CHAT_SEND_MESSAGE,
  GATEWAY_MSG_TYPE,
} from "../etc/constants";
import { startLark } from "../channels/lark";

async function handleChannelMessage(msg: {
  userId: string;
  channelType: string;
  channelId: string;
  roomId: string;
  type: string;
  data: unknown;
}) {
  if (msg.type === GATEWAY_MSG_TYPE) {
    event.emit(EVENT_ID_USER_CHAT_SEND_MESSAGE, {
      userId: msg.userId,
      channelId: msg.channelId,
      roomId: msg.roomId,
      agentId: "main",
      timestamp: Date.now(),
      message: msg.data,
    });
  } else {
    console.log("还不支持其他类型消息 msg.type", msg.type);
  }
}

export async function startGateway() {
  await startLark();
  runAI();

  const server = http.createServer((req, res) => {
    // 普通 HTTP
    if (req.url === "/api") {
      res.end("HTTP response");
    }
  });

  const wss = new WebSocketServer({
    server,
    handleProtocols(protocols, request) {
      try {
        if (!protocols.has("dongxi")) {
          return false;
        }
        if (!protocols.has("zhangjiluo")) {
          return false;
        }

        return "zhangjiluo";
      } catch (error) {
        console.log("handleProtocols error", error);
        return false;
      }
    },
  });

  wss.on("connection", (ws) => {
    console.log(ws.protocol); // 已协商的子协议
    // 认证通过后
    const channel = {
      userId: "main",
      channelType: "cli",
      channelId: "main",
      roomId: "-",
    };
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (typeof data !== "object") {
          return;
        }
        if (!data || !data.type || !data.data) {
          return;
        }
        handleChannelMessage({
          ...data,
          ...channel,
        });
      } catch (error) {
        console.log("on message error", error);
      }
    });

    event.on("*", (type, data) => {
      ws.send(JSON.stringify({ type, data }));
    });
  });

  server.listen(
    {
      port: 18800,
      host: "0.0.0.0",
      reusePort: false,
    },
    () => {
      console.log("Gateway is running on 18800");
    },
  );
}
