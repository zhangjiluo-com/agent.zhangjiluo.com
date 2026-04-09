import { createLogger } from "./etc/log";

const log = createLogger("bootstrap");

function interceptFetch() {
  const originalFetch = global.fetch;

  async function myFetch(input: string | URL | Request, init?: RequestInit) {
    const request = new Request(input, init);
    const __DEBUG__ = false;
    if (
      request.url.startsWith("http://localhost") ||
      request.url.startsWith("http://127.0.0.1")
    ) {
      return originalFetch(request);
    }
    const requestBodyText = await request.clone().text();
    const requestHeaders = Object.fromEntries(request.headers.entries());

    let finalRequest: Request = request;
    let finalRequestBodyText = requestBodyText;

    if (request.url === "https://api.kimi.com/coding/v1/messages") {
      try {
        const parsedBody = JSON.parse(requestBodyText);
        const modifiedBody = {
          ...parsedBody,
          messages: parsedBody.messages.map((msg: any) => ({
            ...msg,
            // content: msg.content.map((content: any) => ({
            //   ...content,
            //   text: content.text.replace(/\n/g, " "),
            // })),
          })),
        };

        finalRequestBodyText = JSON.stringify(modifiedBody);
        finalRequest = new Request(request, {
          body: finalRequestBodyText,
          headers: {
            ...requestHeaders,
            accept: "application/json",
            "user-agent": "Anthropic/JS 0.82.0",
            "x-stainless-arch": "x64",
            "x-stainless-lang": "js",
            "x-stainless-os": "Windows",
            "x-stainless-package-version": "0.82.0",
            "x-stainless-retry-count": "0",
            "x-stainless-runtime": "node",
            "x-stainless-runtime-version": "v24.12.0",
            "x-stainless-timeout": "600",
            "content-length": String(Buffer.byteLength(finalRequestBodyText)),
          },
        });
      } catch {
        finalRequestBodyText = `${requestBodyText}\n[intercepted]`;
        finalRequest = new Request(request, {
          body: finalRequestBodyText,
          headers: {
            ...requestHeaders,
            "content-length": String(Buffer.byteLength(finalRequestBodyText)),
          },
        });
      }
    }

    if (__DEBUG__) {
      log.d("=== FETCH REQUEST ===");
      log.d("URL:", finalRequest.url);
      log.d("METHOD:", finalRequest.method);
      log.d(
        "HEADERS:",
        Object.fromEntries(finalRequest.headers.entries()),
      );
      log.d("BODY:", finalRequestBodyText || null);
    }
    const startTime = Date.now();

    const response = await originalFetch(finalRequest);
    const responseBodyText = await response.clone().text();
    if (__DEBUG__) {
      log.d("=== FETCH RESPONSE ===");
      log.d("STATUS:", response.status, response.statusText);
      log.d("HEADERS:", Object.fromEntries(response.headers.entries()));
      log.d("BODY:", responseBodyText || null);
    }
    log.i("请求耗时:", Math.floor((Date.now() - startTime) / 1000), "秒");

    return response;
  }

  global.fetch = myFetch;
}

async function main() {
  interceptFetch();

  const { start } = await await import("./cli");
  await start();
}

main();
