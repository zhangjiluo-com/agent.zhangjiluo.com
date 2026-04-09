export function getErrorForAi(error?: any) {
  if (error === undefined || error === null) {
    return "unknown error";
  }
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.trim() === "") {
    return "unknown error";
  }
  const maxLength = 256;
  if (msg.length > maxLength) {
    return `${msg.substring(0, maxLength)}...(clip ${msg.length - maxLength} chars)`;
  }
  return msg;
}
