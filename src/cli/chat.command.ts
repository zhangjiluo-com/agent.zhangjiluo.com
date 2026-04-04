import { CAC } from "cac";
import { startCliChannel } from "../channels/cli";

export function registerChatCommand(cli: CAC) {
  cli.command("chat", "聊天").action(async (options) => {
    await startCliChannel();
  });
}
