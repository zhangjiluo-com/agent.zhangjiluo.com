import * as Lark from "@larksuiteoapi/node-sdk";

export async function startLark() {
  const baseConfig = {
    appId: "cli_a95ca220bdb71ceb",
    appSecret: "6suopMhuRAKUNUkpfqvTkdhCrsj1ANyj",
    domain: "https://open.feishu.cn",
  };

  const client = new Lark.Client(baseConfig);
  const wsClient = new Lark.WSClient(baseConfig);

  const eventDispatcher = new Lark.EventDispatcher({}).register({
    async "im.message.receive_v1"(data) {
      const {
        message: { chat_id, content, chat_type },
      } = data;

      let responseText = "";

      try {
        if (data.message.message_type === "text") {
          responseText = JSON.parse(content).text;
        } else {
          responseText =
            "解析消息失败，请发送文本消息 \nparse message failed, please send text message";
        }
      } catch (error) {
        // 解析消息失败，返回错误信息。 Parse message failed, return error message.
        responseText =
          "解析消息失败，请发送文本消息 \nparse message failed, please send text message";
      }

      if (chat_type === "p2p") {
        /**
         * 使用SDK调用发送消息接口。 Use SDK to call send message interface.
         * https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create
         */
        await client.im.v1.message.create({
          params: {
            receive_id_type: "chat_id", // 消息接收者的 ID 类型，设置为会话ID。 ID type of the message receiver, set to chat ID.
          },
          data: {
            receive_id: chat_id, // 消息接收者的 ID 为消息发送的会话ID。 ID of the message receiver is the chat ID of the message sending.
            content: JSON.stringify({
              text: `收到你发送的消息:${responseText}\nReceived message: ${responseText}`,
            }),
            msg_type: "text", // 设置消息类型为文本消息。 Set message type to text message.
          },
        });
      } else {
        /**
         * 使用SDK调用回复消息接口。 Use SDK to call send message interface.
         * https://open.feishu.cn/document/server-docs/im-v1/message/reply
         */
        await client.im.v1.message.reply({
          path: {
            message_id: data.message.message_id, // 要回复的消息 ID。 Message ID to reply.
          },
          data: {
            content: JSON.stringify({
              text: `收到你发送的消息:${responseText}\nReceived message: ${responseText}`,
            }),
            msg_type: "text", // 设置消息类型为文本消息。 Set message type to text message.
          },
        });
      }
    },
  });

  await wsClient.start({ eventDispatcher });

  console.log("Lark channel started");
}
