import { createLogger } from "../etc/log";

import http from "http";
import { WebSocketServer } from "ws";
import { runAI } from "../ai";
import { event } from "./event";
import {
  EVENT_ID_USER_CHAT_SEND_MESSAGE,
  GATEWAY_MSG_TYPE,
} from "../etc/constants";
import { startLark } from "../channels/lark";
import { GatewayInboundMessage } from "../types";

const log = createLogger("gateway");

async function handleChannelMessage(msg: GatewayInboundMessage) {
  if (msg.type === GATEWAY_MSG_TYPE) {
    event.emit(EVENT_ID_USER_CHAT_SEND_MESSAGE, {
      userId: "main",
      channelId: msg.channelId,
      roomId: "-",
      agentId: "main",
      timestamp: Date.now(),
      message: msg.data,
      channelType: msg.channelType,
      origin: msg,
    });
  } else {
    log.w("还不支持其他类型消息 msg.type", msg.type);
  }
}

export async function startGateway() {
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
        log.e("handleProtocols error", error);
        return false;
      }
    },
  });

  wss.on("connection", (ws) => {
    log.i("ws protocol", ws.protocol);
    // 认证通过后
    // const channel = {
    //   userId: "main",
    //   channelType: "cli",
    //   channelId: "main",
    //   roomId: "-",
    // };
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (typeof data !== "object") {
          return;
        }
        if (!data || !data.type || !data.data) {
          return;
        }
        handleChannelMessage(data as GatewayInboundMessage);
      } catch (error) {
        log.e("on message error", error);
      }
    });

    event.on("*", (type, data) => {
      log.d("on event", type, data);
      // 这里应该要过滤
      ws.send(JSON.stringify({ type, data }));
    });
  });

  await new Promise((resolve, reject) => {
    server.on("error", reject);

    server.listen(
      {
        port: 18800,
        host: "0.0.0.0",
        reusePort: false,
      },
      () => {
        log.i("Gateway is running on 18800");
        resolve(1);
      },
    );
  });

  runAI();

  await startLark();
}
