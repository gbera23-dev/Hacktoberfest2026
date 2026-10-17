import { useState } from "react";
import type { Bus, BusStop, Locale } from "../../../api/src/index";
import type { Screen } from "./NavBar";

type Props = {
  locale: Locale;
  screen: Screen;
  selectedStop?: BusStop;
  selectedRoute?: Bus;
};

type ChatMessage = { role: "user" | "assistant"; text: string };

export function Chatbot({ locale, screen, selectedStop, selectedRoute }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const send = async () => {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setSending(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          history: messages,
          context: {
            locale,
            screen,
            selectedStop: selectedStop && { id: selectedStop.id, name: selectedStop.name, code: selectedStop.code, vehicleMode: selectedStop.vehicleMode },
            selectedRoute: selectedRoute && { id: selectedRoute.id, shortName: selectedRoute.shortName, longName: selectedRoute.longName, mode: selectedRoute.mode },
          },
        }),
      });
      const contentType = response.headers.get("content-type") || "";
      const body = await response.text();
      if (!contentType.includes("application/json")) {
        throw new Error("Chat service is unavailable. Start the TTC proxy with `npm run dev`.");
      }
      const data = JSON.parse(body) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Chat request failed");
      setMessages((current) => [...current, { role: "assistant", text: data.message || "Sorry, I cannot help you with that request." }]);
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError" ? "The chat request timed out. Please try again." : error instanceof Error ? error.message : "Chat request failed";
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      window.clearTimeout(timeoutId);
      setSending(false);
    }
  };

  return <>
    <button className="chat-launcher" type="button" aria-expanded={open} aria-controls="ttc-chat-panel" onClick={() => setOpen((value) => !value)}>Chat</button>
    {open && <aside className="chat-panel" id="ttc-chat-panel" aria-label="TTC assistant">
      <header><strong>TTC assistant</strong><button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}>×</button></header>
      <div className="chat-messages" aria-live="polite">{messages.length === 0 && <p className="muted">Ask about TTC stops, routes, or planning a trip.</p>}{messages.map((item, index) => <p className={`chat-message ${item.role}`} key={`${item.role}-${index}`}>{item.text}</p>)}{sending && <p className="muted">Thinking…</p>}</div>
      <form onSubmit={(event) => { event.preventDefault(); void send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about TTC" aria-label="Message" disabled={sending} /><button type="submit" disabled={sending || !input.trim()}>Send</button></form>
    </aside>}
  </>;
}
