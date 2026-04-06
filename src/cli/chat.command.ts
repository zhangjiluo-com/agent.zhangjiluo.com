import { CAC } from "cac";
import readline from "node:readline/promises";
import { stdin as input, stdout as output, exit } from "node:process";
import {
  EVENT_ID_AI_SEND_MESSAGE_TO_USER,
  GATEWAY_MSG_TYPE,
} from "../etc/constants";

// cli 渠道直连 网关 不需要中间渠道

function closeChatCli() {
  console.log("goodbye");
  exit(0);
}

export async function startCliChannel() {
  // 创建 readline 接口
  const rl = readline.createInterface({ input, output, terminal: true });

  // 直连到网关, 不需要中间渠道
  const ws = new WebSocket("ws://127.0.0.1:18800", ["dongxi", "zhangjiluo"]);
  ws.onopen = async () => {
    console.log("已经连接到网关");
    // 1. 应该先请求认证
    // 2. 认证通过后, 才能发送消息
    // 3. 处理消息
    rl.on("close", closeChatCli);

    while (true) {
      const message = (await rl.question("")).trim();

      if (!message) continue;

      if (message.startsWith("/")) {
        // handle command
        console.log("当前不支持命令\n");
        continue;
      } else {
        ws.send(
          JSON.stringify({
            type: GATEWAY_MSG_TYPE,
            data: message,
          }),
        );
      }
    }
  };
  ws.onclose = () => {
    console.log("cli channel close");
    closeChatCli();
  };
  ws.onerror = (err) => {
    console.log("cli channel error", err);
    closeChatCli();
  };
  ws.onmessage = (msg: MessageEvent<string>) => {
    // console.log("cli channel message");
    // console.log(msg);
    // console.log(msg.data);
    // console.log(typeof msg.data);
    const data = JSON.parse(msg.data);
    if (data.type === EVENT_ID_AI_SEND_MESSAGE_TO_USER) {
      const res = data.data;
      if (res.content.type === "text") {
        process.stdout.write(res.content.text);
        process.stdout.write("\n");
      } else {
        console.log("其他类型", res.content);
      }
    }
  };
}

export function registerChatCommand(cli: CAC) {
  cli.command("chat", "聊天").action(async (options) => {
    startCliChannel();
  });
}
