import { useMemo, useRef, useState, type RefObject } from "react";
import { MessageCircle, Search, Send, X } from "lucide-react";
import { PRODUCTS, type Product } from "@/lib/catalog";
import { askShop, type ChatTurn } from "@/lib/chat.functions";

const STARTERS = [
  "What do you have under $80?",
  "How do returns work?",
  "Where is order FF-1042?",
  "Compare the throw and the slippers",
];

export function ShopApp() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content:
        "Hello — I can help you find something in the shop, or answer shipping, returns, and order questions. Demo orders: FF-1042, FF-1108, FF-0981.",
    },
  ]);
  const scroller = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter((p) =>
      [p.name, p.category, p.blurb, p.details].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: ChatTurn[] = [...turns, { role: "user", content }];
    setTurns(next);
    setDraft("");
    setBusy(true);
    setError(null);
    setOpen(true);
    try {
      const result = await askShop({ data: { messages: next } });
      if (!result.ok) {
        setError(result.error);
      } else {
        setTurns((prev) => [...prev, { role: "assistant", content: result.text }]);
      }
    } catch {
      setError("Could not reach the assistant. Try again.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
      });
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-2xl tracking-tight">Field & Form</p>
            <p className="text-sm text-muted">Home goods, made to stay</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg"
          >
            <MessageCircle className="size-4" aria-hidden />
            Ask the shop
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl leading-tight sm:text-4xl">The floor</h1>
              <p className="mt-1 max-w-md text-muted">
                Search the catalog, then ask the assistant about fit, shipping, or a demo order.
              </p>
            </div>
          </div>
          <label className="mb-5 flex min-h-12 items-center gap-2 rounded-full border border-line bg-surface px-4">
            <Search className="size-4 text-muted" aria-hidden />
            <span className="sr-only">Search products</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search kitchen, travel, textiles…"
              className="w-full bg-transparent py-3 outline-none placeholder:text-muted"
            />
          </label>

          {visible.length === 0 ? (
            <p className="rounded-card border border-dashed border-line bg-surface p-8 text-muted">
              Nothing matches that. Try “wool”, “lamp”, or clear the search.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {visible.map((p) => (
                <li key={p.id}>
                  <article className="overflow-hidden rounded-card border border-line bg-surface">
                    <button type="button" onClick={() => setActive(p)} className="block w-full text-left">
                      <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" />
                      <div className="space-y-1 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted">{p.category}</p>
                        <h2 className="font-display text-xl leading-tight">{p.name}</h2>
                        <p className="text-sm text-muted">{p.blurb}</p>
                        <p className="pt-1 font-semibold">${p.price}</p>
                      </div>
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="hidden lg:block">
          <ChatPanel
            open
            turns={turns}
            draft={draft}
            busy={busy}
            error={error}
            scroller={scroller}
            onDraft={setDraft}
            onSend={() => void send(draft)}
            onStarter={(s) => void send(s)}
            onClose={() => undefined}
          />
        </aside>
      </main>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-20 p-3 lg:hidden">
          <ChatPanel
            open
            turns={turns}
            draft={draft}
            busy={busy}
            error={error}
            scroller={scroller}
            onDraft={setDraft}
            onSend={() => void send(draft)}
            onStarter={(s) => void send(s)}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-4 z-20 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg lg:hidden"
          aria-label="Open shop assistant"
        >
          <MessageCircle className="size-6" />
        </button>
      )}

      {active && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 p-3 sm:items-center" role="dialog" aria-modal>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-card bg-surface">
            <img src={active.image} alt="" className="aspect-[4/3] w-full object-cover" />
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">{active.category}</p>
                  <h2 className="font-display text-2xl">{active.name}</h2>
                </div>
                <button type="button" onClick={() => setActive(null)} aria-label="Close" className="rounded-full p-2">
                  <X className="size-5" />
                </button>
              </div>
              <p className="text-muted">{active.details}</p>
              <p className="text-sm text-muted">{active.stock} in stock</p>
              <p className="font-display text-3xl">${active.price}</p>
              <button
                type="button"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-4 font-semibold text-surface"
                onClick={() => {
                  setActive(null);
                  void send(`Tell me if the ${active.name} is a good fit, and the price and shipping.`);
                }}
              >
                Ask about this
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatPanel({
  turns,
  draft,
  busy,
  error,
  scroller,
  onDraft,
  onSend,
  onStarter,
  onClose,
}: {
  open: boolean;
  turns: ChatTurn[];
  draft: string;
  busy: boolean;
  error: string | null;
  scroller: RefObject<HTMLDivElement | null>;
  onDraft: (v: string) => void;
  onSend: () => void;
  onStarter: (s: string) => void;
  onClose: () => void;
}) {
  return (
    <section className="flex h-[min(32rem,70vh)] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-sm">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="font-display text-lg leading-tight">Shop assistant</p>
          <p className="text-xs text-muted">Products, shipping, returns, orders</p>
        </div>
        <button type="button" className="rounded-full p-2 lg:hidden" onClick={onClose} aria-label="Close chat">
          <X className="size-4" />
        </button>
      </header>
      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {turns.map((t, i) => (
          <p
            key={i}
            className={
              t.role === "user"
                ? "ml-8 rounded-2xl bg-primary px-3 py-2 text-sm text-primary-fg"
                : "mr-6 rounded-2xl bg-bg px-3 py-2 text-sm leading-relaxed"
            }
          >
            {t.content}
          </p>
        ))}
        {busy && <p className="text-sm text-muted">Looking that up…</p>}
        {error && <p className="text-sm text-accent">{error}</p>}
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 pb-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => onStarter(s)}
            className="shrink-0 rounded-full border border-line px-3 py-2 text-xs text-ink disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <input
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          placeholder="Ask about a product or an order…"
          className="min-h-11 flex-1 rounded-full border border-line bg-bg px-4 outline-none"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label="Send"
          className="inline-flex size-11 items-center justify-center rounded-full bg-primary text-primary-fg disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </section>
  );
}
