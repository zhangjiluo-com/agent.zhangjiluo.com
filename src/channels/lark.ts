import { Client, EventDispatcher, WSClient } from "@larksuiteoapi/node-sdk";
import {
  EVENT_ID_AI_SEND_MESSAGE_TO_USER,
  GATEWAY_MSG_TYPE,
} from "../etc/constants";
import { GatewayInboundMessage } from "../types";

export async function startLark() {
  const baseConfig = {
    appId: "cli_a95ca220bdb71ceb",
    appSecret: "6suopMhuRAKUNUkpfqvTkdhCrsj1ANyj",
    domain: "https://open.feishu.cn",
  };

  const client = new Client(baseConfig);
  const wsClient = new WSClient(baseConfig);

  const gatewayClient = new WebSocket("ws://127.0.0.1:18800");

  gatewayClient.onopen = () => {
    console.log("Gateway is connected");
  };

  gatewayClient.onclose = () => {
    console.log("Gateway is closed");
  };

  gatewayClient.onerror = (error) => {
    console.log("Gateway error", error);
  };

  gatewayClient.onmessage = async (msg) => {
    const msgData = JSON.parse(msg.data);
    if (msgData.type !== EVENT_ID_AI_SEND_MESSAGE_TO_USER) {
      return;
    }
    console.log("Gateway message  bbbb", msgData);
    try {
      await client.im.v1.message.create({
        params: {
          receive_id_type: "chat_id", // 消息接收者的 ID 类型，设置为会话ID。 ID type of the message receiver, set to chat ID.
        },
        data: {
          receive_id: msgData.data.channelId, // 消息接收者的 ID 为消息发送的会话ID。 ID of the message receiver is the chat ID of the message sending.
          content: JSON.stringify({
            text: msgData.data.content.text,
            // text: `999999收到你发送的消息:${responseText}\nReceived message: ${responseText}`,
          }),
          msg_type: "text", // 设置消息类型为文本消息。 Set message type to text message.
        },
      });
    } catch (error) {
      console.log("send message error", error);
    }
  };

  const eventDispatcher = new EventDispatcher({}).register({
    async "im.message.receive_v1"(data) {
      const {
        message: { chat_id, content, chat_type },
      } = data;

      console.log("im.message.receive_v1", data);

      let responseText = "";

      try {
        if (data.message.message_type === "text") {
          responseText = JSON.parse(content).text;

          gatewayClient.send(
            JSON.stringify({
              type: GATEWAY_MSG_TYPE,
              data: responseText,
              channelType: "lark",
              channelId: chat_id,
              extra: data,
            } satisfies GatewayInboundMessage),
          );
          console.log(responseText);
        } else {
          responseText =
            "解析消息失败，请发送文本消息 \nparse message failed, please send text message";
        }
      } catch (error) {
        // 解析消息失败，返回错误信息。 Parse message failed, return error message.
        responseText =
          "解析消息失败，请发送文本消息 \nparse message failed, please send text message";
      }

      console.log(chat_type);
      return;

      if (chat_type === "p2p") {
        /**
         * 使用SDK调用发送消息接口。 Use SDK to call send message interface.
         * https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create
         */
        setTimeout(() => {
          client.im.v1.message.create({
            params: {
              receive_id_type: "chat_id", // 消息接收者的 ID 类型，设置为会话ID。 ID type of the message receiver, set to chat ID.
            },
            data: {
              receive_id: chat_id, // 消息接收者的 ID 为消息发送的会话ID。 ID of the message receiver is the chat ID of the message sending.
              content: JSON.stringify({
                text: `999999收到你发送的消息:${responseText}\nReceived message: ${responseText}`,
              }),
              msg_type: "text", // 设置消息类型为文本消息。 Set message type to text message.
            },
          });
        }, 1000);
      } else {
        /**
         * 使用SDK调用回复消息接口。 Use SDK to call send message interface.
         * https://open.feishu.cn/document/server-docs/im-v1/message/reply
         */
        // await client.im.v1.message.reply({
        //   path: {
        //     message_id: data.message.message_id, // 要回复的消息 ID。 Message ID to reply.
        //   },
        //   data: {
        //     content: JSON.stringify({
        //       text: `收到你发送的消息:${responseText}\nReceived message: ${responseText}`,
        //     }),
        //     msg_type: "text", // 设置消息类型为文本消息。 Set message type to text message.
        //   },
        // });
      }
    },
  });

  await wsClient.start({ eventDispatcher });

  console.log("Lark channel started");
}
