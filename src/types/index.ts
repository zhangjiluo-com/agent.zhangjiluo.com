/**
 * 网关消息
 * 外部渠道发往网关的消息
 */
export interface GatewayInboundMessage {
  type: string; // 消息类型, 消息, 指令
  channelType: string; // 渠道类型, lark, slack, etc
  channelId: string; // 渠道ID
  data: unknown; // 消息数据
  extra: Record<string, unknown>; // 额外数据
}

export interface EventMessage {
  type: string; // 事件类型
  data: unknown; // 事件数据
}

export interface AiMessageEvent {
  type: string; // 消息类型, 消息, 指令
  data: {
    // userId: string;
    channelType: string; // 发往哪个频道
    // channelId: string;
    // agentId: string;
    // roomId: string;
    timestamp: number;
    message: string; // 消息内容
    trigger: unknown; // 触发AI 响应的事件
  };
}
