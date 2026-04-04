import readline from "node:readline/promises";
import { stdin as input, stdout as output, exit } from "node:process";
import { event } from "../gateway/event";

function closeChatCli() {
  console.log("goodbye");
  exit(0);
}

function listen() {
  event.on("llmResponse", (res: any) => {
    console.log(res);

    // throw new Error("llmResponse not implemented");

    // const res = await chat(line);
    for (let index = 0; index < res.content.length; index++) {
      const element = res.content[index];
      if (element.type === "text") {
        process.stdout.write("AI: ");
        process.stdout.write(element.text);
      }
    }
    process.stdout.write("\n");
  });
}

export async function startCliChannel() {
  const rl = readline.createInterface({ input, output, terminal: true });

  const ws = new WebSocket("ws://localhost:18800");
  ws.onopen = async () => {
    console.log("cli channel open");

    rl.on("close", closeChatCli);

    while (true) {
      const message = (await rl.question("")).trim();

      if (!message) continue;

      if (message.startsWith("/")) {
        // handle command
        continue;
      } else {
        ws.send(
          JSON.stringify({
            type: "sendMessage",
            data: {
              message,
              userId: "123",
              roomId: "123",
              timestamp: Date.now(),
              channelId: "123",
            },
          }),
        );
      }
      // process.stdout.write("\n");
    }
    rl.close();
  };
  ws.onclose = () => {
    console.log("cli channel close");
    closeChatCli();
  };
  ws.onerror = (err) => {
    console.log("cli channel error");
    console.log(err);
    closeChatCli();
  };
  ws.onmessage = (msg: MessageEvent<string>) => {
    // console.log("cli channel message");
    // console.log(msg);
    // console.log(msg.data);
    // console.log(typeof msg.data);
    const data = JSON.parse(msg.data);
    if (data.type === "llmResponse") {
      const res = data.data;
      for (let index = 0; index < res.content.length; index++) {
        const element = res.content[index];
        if (element.type === "text") {
          process.stdout.write(element.text);
        }
      }
      process.stdout.write("\n");
    }
  };
}
