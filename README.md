# agent.zhangjiluo.com

调用链路:

cli -> user -> gateway -> agent -> llm

llm -> agent -> agent tool -> llm

## 渠道

指的是用户与系统之间的通信路径, 每个用户可以有多个渠道接入进来

## 用户

指的是使用此AI助手的人, 每个人接入该系统, 应该单独创建一个用户

## 网关

网关是指用户与系统之间的接口,, 负责接收用户的消息, 并将其转发给系统中的其他组件,也相当与系统的入口,守护系统的进程, 即 server

## 消息中枢

消息中枢是指系统中的一个组件, 负责接收所有消息,并派发订阅了该消息的组件, 即消息的分发中心

## 接待AI(助手,专属)

负责接待用户的消息的Agent,即主Agent
每个用户都有一个专属的接待AI, 用于处理该用户的任务

## 实施AI

负责处理任务的Agent,分规划Agent 和执行Agent, 验收Agent

从属于接待AI 或者 定制AI

## 定制AI(可多用户共享访问)

负责处理特殊任务的Agent

## LLM

大模型, 大脑

## 任务

接待 Agent 简单分析用户需求, 如果完成不了, 则调用快速评估Agent(评估能否完成),如果能完成,则告诉接待agent可以派发异步任务,如果不能完成,也告诉接待Agent.
如果可以完成, 接待Agent 就派发一个异步任务到任务表.
系统 观察任务表, 如果有任务进来,就派发到一个快速任务Agent 处理.
快速任务Agent 先判断任务是否复杂,如果任务复杂, 需要调整任务复杂度, 然后再派发到一个快速任务Agent 处理.

## MCP

系统启动后会自动读取项目根目录下的 `mcp.config.json` 并连接其中声明的 MCP Server。

配置格式:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "docs": {
      "transport": "http",
      "url": "http://localhost:3000/mcp"
    },
    "legacy": {
      "transport": "sse",
      "url": "http://localhost:3001/sse"
    }
  }
}
```

- `command` 存在时默认按 `stdio` 方式连接
- `transport` 支持 `stdio`、`http`、`sse`
- `disabled: true` 可以临时关闭某个 server
- `mcp.config.example.json` 提供了示例模板
- 加载后的工具会自动挂到主 Agent 和任务 Agent 上
- 为避免重名, MCP 工具会以 `mcp_服务名__工具名` 的形式注册
