import { log } from "../etc/log";

import http from "http";
import { WebSocketServer } from "ws";
import { runAI } from "../ai";
import { event } from "./event";

export function startGateway() {
  runAI();

  const server = http.createServer((req, res) => {
    // 普通 HTTP
    if (req.url === "/api") {
      res.end("HTTP response");
    }
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("on connection");
    ws.on("message", (msg) => {
      const data = JSON.parse(msg);
      console.log("on message", JSON.parse(msg));

      event.emit(data.type, data.data);

      // ws.send("WS response: " + msg);
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
