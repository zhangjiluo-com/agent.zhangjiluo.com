type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function parseLogLevel(value?: string): LogLevel {
  const normalized = value?.toLowerCase();
  if (normalized === "debug") return "debug";
  if (normalized === "info") return "info";
  if (normalized === "warn") return "warn";
  if (normalized === "error") return "error";
  return "info";
}

function shouldLog(targetLevel: LogLevel) {
  const globalLevel = parseLogLevel(process.env.LOG_LEVEL);
  return LOG_LEVEL_PRIORITY[targetLevel] >= LOG_LEVEL_PRIORITY[globalLevel];
}

function output(level: LogLevel, scope: string, ...msg: unknown[]) {
  if (!shouldLog(level)) return;
  const prefix = `[${new Date().toISOString()}][${level.toUpperCase()}][${scope}]`;
  if (level === "error") {
    console.error(prefix, ...msg);
    return;
  }
  if (level === "warn") {
    console.warn(prefix, ...msg);
    return;
  }
  console.log(prefix, ...msg);
}

export function createLogger(scope: string) {
  return {
    d(...msg: unknown[]) {
      output("debug", scope, ...msg);
    },
    i(...msg: unknown[]) {
      output("info", scope, ...msg);
    },
    w(...msg: unknown[]) {
      output("warn", scope, ...msg);
    },
    e(...msg: unknown[]) {
      output("error", scope, ...msg);
    },
  };
}

export const log = createLogger("app");
