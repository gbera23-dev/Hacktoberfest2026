import { TtcApi, type GoogleTransitRoute, type LatLng, type Locale } from "../../api/src/index";

// The same-origin path is handled by the local/production server proxy.
export const ttc = new TtcApi({ baseUrl: "/api/ttc" });

export async function getGoogleTransitRoutes(from: LatLng, to: LatLng, locale: Locale): Promise<{ routes: GoogleTransitRoute[] }> {
  const response = await fetch(`/api/google/transit-route?from=${encodeURIComponent(from.join(","))}&to=${encodeURIComponent(to.join(","))}&locale=${locale}`);
  const data = await response.json() as { message?: string; routes?: GoogleTransitRoute[] };
  if (!response.ok) throw new Error(data.message ?? "Google transit route request failed");
  return { routes: data.routes ?? [] };
}
