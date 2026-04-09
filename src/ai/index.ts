import { linsten } from "./core";
import { asyncTaskAgentLinsten } from "./task/async-task-agent";

export function runAI() {
  linsten();
  asyncTaskAgentLinsten();
}
