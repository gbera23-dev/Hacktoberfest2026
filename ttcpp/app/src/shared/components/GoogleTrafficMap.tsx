import { useEffect, useRef, useState } from "react";
import type { LatLng } from "../../../../shared/api/src/index";

let googleMapsPromise: Promise<void> | undefined;

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (!__GOOGLE_MAPS_API_KEY__) {
      reject(new Error("Google Maps API key is not configured."));
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.dataset.googleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(__GOOGLE_MAPS_API_KEY__)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

type Props = { center: LatLng; zoom?: number; onViewportChange?: (center: LatLng, zoom: number) => void; locale?: "en" | "ka" };

type LocationProps = Props & { userLocation?: LatLng };

export function GoogleTrafficMap({ center, zoom = 12, onViewportChange, userLocation, locale = "en" }: LocationProps) {
  const labels = locale === "ka" ? { location: "თქვენი მდებარეობა", trafficMap: "რეალური მოძრაობის რუკა", free: "თავისუფალი", slow: "ნელი", congested: "გადატვირთული", mapLegend: "მოძრაობის ლეგენდა" } : { location: "Your location", trafficMap: "Live traffic map", free: "Free", slow: "Slow", congested: "Congested", mapLegend: "Traffic legend" };
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ setCenter: (point: { lat: number; lng: number }) => void; setZoom: (zoom: number) => void } | null>(null);
  const markerRef = useRef<{ setMap: (map: unknown | null) => void } | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    loadGoogleMaps()
      .then(() => {
        if (disposed || !elementRef.current || !window.google?.maps) return;
        const map = new window.google.maps.Map(elementRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom,
        });
        mapRef.current = map;
        const trafficLayer = new window.google.maps.TrafficLayer();
        trafficLayer.setMap(map);
        if (userLocation) markerRef.current = new window.google.maps.Marker({ map, position: { lat: userLocation[0], lng: userLocation[1] }, title: labels.location });
        const reportViewport = () => {
          const currentCenter = map.getCenter();
          onViewportChange?.([currentCenter.lat(), currentCenter.lng()], map.getZoom());
        };
        const listeners = [map.addListener("dragend", reportViewport), map.addListener("zoom_changed", reportViewport)];
        cleanup = () => {
          listeners.forEach((listener) => listener.remove());
          trafficLayer.setMap(null);
          markerRef.current?.setMap(null);
          markerRef.current = null;
          mapRef.current = null;
        };
      })
      .catch((cause: unknown) => {
        if (!disposed) setError(cause instanceof Error ? cause.message : "Google Maps failed to load.");
      });
    return () => { disposed = true; cleanup?.(); };
  }, []);

  useEffect(() => {
    if (!userLocation || !window.google?.maps || !mapRef.current) return;
    const position = { lat: userLocation[0], lng: userLocation[1] };
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(Math.max(15, zoom));
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({ map: mapRef.current, position, title: labels.location });
  }, [userLocation]);

  return <div className="google-traffic-map">
    <div ref={elementRef} className="map" aria-label={labels.trafficMap} />
    {error && <div className="traffic-map-error" role="alert">{error}</div>}
    <div className="traffic-legend" aria-label={labels.mapLegend}><span><i className="traffic-green" />{labels.free}</span><span><i className="traffic-yellow" />{labels.slow}</span><span><i className="traffic-red" />{labels.congested}</span></div>
  </div>;
}
