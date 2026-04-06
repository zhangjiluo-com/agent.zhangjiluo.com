export async function loadBasePrompt() {
  return `You are a helpful assistant. Respond in the same language the user uses.
You run on windows 11 and can access whole computer. Current time is ${new Date().toLocaleString()}.
`;
}

export async function loadUserPrompt() {
  // 用户的一些信息
  return `# User
  name: 张三
`;
}

export async function loadAgentDefinePrompt() {
  // agent 的一些定义
}

export async function loadChannelPrompt() {
  // channel 的一些信息
}
