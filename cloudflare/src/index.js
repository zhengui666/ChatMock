const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Session-Id,session_id",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function buildContentItems(content) {
  if (typeof content === "string") {
    return [{ type: "input_text", text: content }];
  }

  if (Array.isArray(content)) {
    const flattened = content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && typeof item.text === "string") {
          return item.text;
        }
        return JSON.stringify(item ?? "");
      })
      .filter((text) => typeof text === "string");
    if (flattened.length) {
      return [{ type: "input_text", text: flattened.join("\n") }];
    }
  }

  if (content && typeof content === "object" && typeof content.text === "string") {
    return [{ type: "input_text", text: content.text }];
  }

  return [{ type: "input_text", text: String(content ?? "") }];
}

function buildResponsesInput(messages) {
  return messages
    .filter((msg) => msg && typeof msg === "object")
    .map((msg) => {
      const role = typeof msg.role === "string" ? msg.role : "user";
      const content = buildContentItems(msg.content ?? "");
      return { type: "message", role, content };
    });
}

async function handleChatCompletions(request, env) {
  if (!env.CHATGPT_ACCESS_TOKEN || !env.CHATGPT_ACCOUNT_ID) {
    return jsonResponse(
      { error: { message: "Missing CHATGPT_ACCESS_TOKEN or CHATGPT_ACCOUNT_ID" } },
      401,
    );
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: { message: "Invalid JSON body" } }, 400);
  }

  const requestedModel = typeof payload.model === "string" ? payload.model : "gpt-5";
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const input = buildResponsesInput(messages);

  if (!input.length && typeof payload.prompt === "string" && payload.prompt.trim()) {
    input.push({
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: payload.prompt }],
    });
  }

  const upstreamPayload = {
    model: requestedModel,
    stream: true,
    input,
    instructions: payload.instructions || env.BASE_INSTRUCTIONS || undefined,
    store: false,
  };

  if (Array.isArray(payload.tools)) {
    upstreamPayload.tools = payload.tools;
  }

  const upstream = await fetch("https://chatgpt.com/backend-api/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CHATGPT_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "chatgpt-account-id": env.CHATGPT_ACCOUNT_ID,
      "OpenAI-Beta": "responses=experimental",
    },
    body: JSON.stringify(upstreamPayload),
  });

  const headers = {
    ...CORS_HEADERS,
    "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream",
    "Cache-Control": "no-store",
  };

  return new Response(upstream.body, { status: upstream.status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("ok", { status: 200, headers: CORS_HEADERS });
    }

    if (request.method === "POST" && url.pathname === "/v1/chat/completions") {
      return handleChatCompletions(request, env);
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },
};
