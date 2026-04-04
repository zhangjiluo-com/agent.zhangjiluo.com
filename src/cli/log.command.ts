import { CAC } from "cac";

export function registerLogCommand(cli: CAC) {
  cli.command("log").action(async () => {
    await new Promise(() => {});
  });
}
