import { createServerFn } from "@tanstack/react-start";
import { formatCatalog, localReply, POLICIES } from "@/lib/catalog";
import { rateLimit } from "@/lib/rate-limit";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are the shop assistant for Field & Form, a small home-goods store.
Help with product search and customer support. Be concise, warm, and specific.
Only recommend products that exist in the catalog. Quote prices in USD.
If someone asks about an order, use the demo order notes below. Do not invent tracking beyond those notes.
If you cannot answer, say so and suggest emailing hello@fieldandform.example.

Catalog:
${formatCatalog()}

Policies:
Shipping: ${POLICIES.shipping}
Returns: ${POLICIES.returns}
Orders: ${POLICIES.orders}
Care: ${POLICIES.care}`;

export const askShop = createServerFn({ method: "POST" })
  .validator((input: { messages: ChatTurn[]; sessionId?: string }) => {
    const messages = (input.messages ?? []).slice(-8).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content ?? "").slice(0, 800),
    }));
    if (!messages.length || messages[messages.length - 1]?.role !== "user") {
      throw new Error("Send a message first.");
    }
    const sessionId = String(input.sessionId ?? "guest").slice(0, 64);
    return { messages, sessionId };
  })
  .handler(async ({ data }) => {
    const limited = rateLimit(data.sessionId);
    if (!limited.ok) {
      return {
        ok: false as const,
        error: `Too many messages. Try again in ${limited.retryAfter}s.`,
      };
    }
    const apiKey = process.env.XAI_API_KEY;
    const last = data.messages[data.messages.length - 1]?.content ?? "";
    if (!apiKey) {
      return { ok: true as const, text: localReply(last) };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 420,
        temperature: 0.4,
        messages: [{ role: "system", content: SYSTEM }, ...data.messages],
      }),
    });

    if (!res.ok) {
      return { ok: true as const, text: localReply(last) };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "Empty reply. Try again." };
    return { ok: true as const, text };
  });
