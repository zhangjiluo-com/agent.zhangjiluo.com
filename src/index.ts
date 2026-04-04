const originalFetch = global.fetch;

global.fetch = async (url, options) => {
  const startedAt = Date.now();
  console.log("=== FETCH REQUEST ===");
  console.log("URL:", url);
  console.log("BODY:", options?.body);

  try {
    const response = await originalFetch(url, options);
    const durationMs = Date.now() - startedAt;
    const contentType = response.headers.get("content-type");
    const responseText = await response.clone().text();
    const responsePreview =
      responseText.length > 1000
        ? `${responseText.slice(0, 1000)}...<truncated>`
        : responseText;

    console.log("=== FETCH RESPONSE ===");
    console.log("STATUS:", response.status, response.statusText);
    console.log("DURATION_MS:", durationMs / 1e3, "秒");
    console.log("CONTENT_TYPE:", contentType);
    console.log("RESPONSE_BODY:", responsePreview);

    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.log("=== FETCH ERROR ===");
    console.log("DURATION_MS:", durationMs / 1e3, "秒");
    console.error(error);
    throw error;
  }
};

async function main() {
  const { start } = await await import("./cli");
  await start();
}

main();
