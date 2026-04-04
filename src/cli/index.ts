import cac from "cac";
import { registerGatewayCommand } from "./gateway.command";
import { registerChatCommand } from "./chat.command";
import { registerLogCommand } from "./log.command";

export function start() {
  console.log("start cai");

  const cli = cac("cai").version("0.0.1");

  registerChatCommand(cli);
  registerGatewayCommand(cli);
  registerLogCommand(cli);

  const parsed = cli.parse();
}
