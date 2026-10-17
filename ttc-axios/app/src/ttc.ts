import { TtcApi, type GooglePlace, type GoogleTransitRoute, type LatLng, type Locale } from "../../api/src/index";

export type WhatIfRequest = { from: LatLng; to: LatLng; locale: Locale; offsetsMinutes: number[] };

// The same-origin path is handled by the local/production server proxy.
export const ttc = new TtcApi({ baseUrl: "/api/ttc" });

export async function getGoogleTransitRoutes(from: LatLng, to: LatLng, locale: Locale): Promise<{ routes: GoogleTransitRoute[] }> {
  const response = await fetch(`/api/google/transit-route?from=${encodeURIComponent(from.join(","))}&to=${encodeURIComponent(to.join(","))}&locale=${locale}`);
  const data = await response.json() as { message?: string; routes?: GoogleTransitRoute[] };
  if (!response.ok) throw new Error(data.message ?? "Google transit route request failed");
  return { routes: data.routes ?? [] };
}

export async function searchGooglePlaces(query: string, locale: Locale, center?: LatLng): Promise<{ places: GooglePlace[] }> {
  const params = new URLSearchParams({ q: query, locale });
  if (center) { params.set("lat", String(center[0])); params.set("lon", String(center[1])); }
  const response = await fetch(`/api/google/places/search?${params.toString()}`);
  const data = await response.json() as { message?: string; places?: GooglePlace[] };
  if (!response.ok) throw new Error(data.message ?? "Google Places search failed");
  return { places: data.places ?? [] };
}

export async function simulateDepartures(request: WhatIfRequest): Promise<{ message: string }> {
  const response = await fetch("/api/what-if", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
  const data = await response.json() as { message?: string };
  if (!response.ok) throw new Error(data.message ?? "What-if simulation failed");
  return { message: data.message ?? "No simulation result returned." };
}
