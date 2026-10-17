import axios, { type AxiosInstance } from "axios";
import type { Locale } from "./types.js";

export const TTC_BASE_URL = "https://transit.ttc.com.ge/pis-gateway/api/v2";

export interface TtcOptions {
  /** Injected key, sent as the X-Api-Key header. Leave empty if a proxy adds it for you. */
  apiKey?: string;
  /** Defaults to the TTC gateway. Use "/ttc" if you go through a dev proxy (see README). */
  baseUrl?: string;
  locale?: Locale;
  timeoutMs?: number;
}

export interface HttpHandle {
  http: AxiosInstance;
  setLocale(l: Locale): void;
}

export function createHttp(opts: TtcOptions = {}): HttpHandle {
  let locale: Locale = opts.locale ?? "en";
  const http = axios.create({
    baseURL: opts.baseUrl ?? TTC_BASE_URL,
    timeout: opts.timeoutMs ?? 8000,
    headers: opts.apiKey ? { "X-Api-Key": opts.apiKey } : {},
  });
  // axios replaces instance-level `params` when a request has its own, so add the locale here instead.
  http.interceptors.request.use((cfg) => {
    const params = { ...(cfg.params ?? {}) };
    if (params.locale === undefined) params.locale = locale;
    cfg.params = params;
    return cfg;
  });
  return { http, setLocale: (l) => { locale = l; } };
}

/** The API wants feed-prefixed ids ("1:1946"). Pass bare ids everywhere in your code. */
export const fid = (id: string | number) => `1:${String(id).replace(/^1:/, "")}`;
