import { CAC } from "cac";
import { startGateway } from "../gateway";

export function registerGatewayCommand(cli: CAC) {
  cli.command("gateway", "网关").action(() => {
    startGateway();
  });
}
