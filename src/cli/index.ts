import cac from "cac";
import { registerGatewayCommand } from "./gateway.command";
import { registerChatCommand } from "./chat.command";
import { registerLogCommand } from "./log.command";
import { createLogger } from "../etc/log";

const log = createLogger("cli:index");

export function start() {
  log.i("start cai");

  const cli = cac("cai").version("0.0.1");

  registerChatCommand(cli);
  registerGatewayCommand(cli);
  registerLogCommand(cli);

  const parsed = cli.parse();
}
