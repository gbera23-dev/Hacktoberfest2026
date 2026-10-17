import { useEffect, useRef, useState } from "react";
import type { Bus, BusStop, Locale } from "../../../api/src/index";
import type { Screen } from "./NavBar";

type Props = {
  locale: Locale;
  screen: Screen;
  selectedStop?: BusStop;
  selectedRoute?: Bus;
};

type ChatMessage = { role: "user" | "assistant"; text: string };

type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = Event & { resultIndex: number; results: { length: number; [index: number]: SpeechResult } };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function Chatbot({ locale, screen, selectedStop, selectedRoute }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | undefined>(undefined);
  const speechBaseRef = useRef("");
  const speechFinalRef = useRef("");
  const speechLabels = locale === "ka" ? { microphone: "ხმის ჩართვა", stopListening: "ჩაწერის შეწყვეტა" } : { microphone: "Use microphone", stopListening: "Stop listening" };
  const speechLanguage = locale === "ka" ? "ka-GE" : "en-US";
  const labels = locale === "ka" ? { chat: "TTC ასისტენტი", close: "ასისტენტის დახურვა", empty: "ჰკითხეთ TTC-ის გაჩერებების, მარშრუტების ან მგზავრობის დაგეგმვის შესახებ.", placeholder: "ჰკითხეთ TTC-ს", send: "გაგზავნა", thinking: "მუშავდება…", unsupported: "ამ ბრაუზერს ხმოვანი შეყვანა არ აქვს მხარდაჭერილი.", speechFailed: "ხმის გაგება ვერ მოხერხდა. სცადეთ თავიდან.", unavailable: "ჩატის სერვისი მიუწვდომელია. გაუშვით TTC proxy `npm run dev` ბრძანებით.", failed: "ჩატის მოთხოვნა ვერ შესრულდა.", timeout: "ჩატის მოთხოვნას დრო ამოეწურა. სცადეთ თავიდან.", cannotHelp: "უკაცრავად, ამ მოთხოვნაში ვერ დაგეხმარებით." } : { chat: "TTC assistant", close: "Close assistant", empty: "Ask about TTC stops, routes, or planning a trip.", placeholder: "Ask about TTC", send: "Send", thinking: "Thinking…", unsupported: "Speech input is not supported by this browser.", speechFailed: "Could not understand speech. Please try again.", unavailable: "Chat service is unavailable. Start the TTC proxy with `npm run dev`.", failed: "Chat request failed.", timeout: "The chat request timed out. Please try again.", cannotHelp: "Sorry, I cannot help you with that request." };

  const speechConstructor = () => {
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = undefined;
    setListening(false);
  };

  const toggleListening = () => {
    if (listening) { stopListening(); return; }
    const Recognition = speechConstructor();
    if (!Recognition) {
      setSpeechError(labels.unsupported);
      return;
    }
    setSpeechError("");
    speechBaseRef.current = input.trim();
    speechFinalRef.current = "";
    const recognition = new Recognition();
    recognition.lang = speechLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) speechFinalRef.current += `${transcript} `;
        else interim += transcript;
      }
      setInput(`${speechBaseRef.current} ${speechFinalRef.current} ${interim}`.trim());
    };
    recognition.onerror = () => {
      setSpeechError(labels.speechFailed);
      setListening(false);
      recognitionRef.current = undefined;
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = undefined;
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const send = async () => {
    const message = input.trim();
    if (!message || sending) return;
    stopListening();
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
        throw new Error(labels.unavailable);
      }
      const data = JSON.parse(body) as { message?: string };
      if (!response.ok) throw new Error(data.message || labels.failed);
      setMessages((current) => [...current, { role: "assistant", text: data.message || labels.cannotHelp }]);
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError" ? labels.timeout : error instanceof Error ? error.message : labels.failed;
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      window.clearTimeout(timeoutId);
      setSending(false);
    }
  };

  return <>
    <button className="chat-launcher" type="button" aria-expanded={open} aria-controls="ttc-chat-panel" onClick={() => setOpen((value) => !value)}>{locale === "ka" ? "ჩატი" : "Chat"}</button>
    {open && <aside className="chat-panel" id="ttc-chat-panel" aria-label={labels.chat}>
      <header><strong>{labels.chat}</strong><button type="button" aria-label={labels.close} onClick={() => setOpen(false)}>×</button></header>
      <div className="chat-messages" aria-live="polite">{messages.length === 0 && <p className="muted">{labels.empty}</p>}{messages.map((item, index) => <p className={`chat-message ${item.role}`} key={`${item.role}-${index}`}>{item.text}</p>)}{sending && <p className="muted">{labels.thinking}</p>}</div>
      <form onSubmit={(event) => { event.preventDefault(); void send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={labels.placeholder} aria-label={labels.placeholder} disabled={sending} /><button className={`mic-button ${listening ? "listening" : ""}`} type="button" onClick={toggleListening} aria-label={listening ? speechLabels.stopListening : speechLabels.microphone} aria-pressed={listening} disabled={sending}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></svg></button><button type="submit" disabled={sending || !input.trim()}>{labels.send}</button></form>{speechError && <p className="speech-error" role="alert">{speechError}</p>}
    </aside>}
  </>;
}
