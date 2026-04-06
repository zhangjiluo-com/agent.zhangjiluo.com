function interceptFetch() {
  const originalFetch = global.fetch;

  async function myFetch(input: string | URL | Request, init?: RequestInit) {
    const request = new Request(input, init);
    const __DEBUG__ = false;
    if (
      !__DEBUG__ ||
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

    console.log("=== FETCH REQUEST ===");
    console.log("URL:", finalRequest.url);
    console.log("METHOD:", finalRequest.method);
    console.log("HEADERS:", Object.fromEntries(finalRequest.headers.entries()));
    console.log("BODY:", finalRequestBodyText || null);

    const response = await originalFetch(finalRequest);
    const responseBodyText = await response.clone().text();
    console.log("=== FETCH RESPONSE ===");
    console.log("STATUS:", response.status, response.statusText);
    console.log("HEADERS:", Object.fromEntries(response.headers.entries()));
    console.log("BODY:", responseBodyText || null);

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
