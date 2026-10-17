import { useEffect, useRef, useState } from "react";
import type { LatLng } from "../../../api/src/index";

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

type Props = { center: LatLng; zoom?: number; onViewportChange?: (center: LatLng, zoom: number) => void };

export function GoogleTrafficMap({ center, zoom = 12, onViewportChange }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
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
        const trafficLayer = new window.google.maps.TrafficLayer();
        trafficLayer.setMap(map);
        const reportViewport = () => {
          const currentCenter = map.getCenter();
          onViewportChange?.([currentCenter.lat(), currentCenter.lng()], map.getZoom());
        };
        const listeners = [map.addListener("dragend", reportViewport), map.addListener("zoom_changed", reportViewport)];
        cleanup = () => {
          listeners.forEach((listener) => listener.remove());
          trafficLayer.setMap(null);
        };
      })
      .catch((cause: unknown) => {
        if (!disposed) setError(cause instanceof Error ? cause.message : "Google Maps failed to load.");
      });
    return () => { disposed = true; cleanup?.(); };
  }, []);

  return <div className="google-traffic-map">
    <div ref={elementRef} className="map" aria-label="Live traffic map" />
    {error && <div className="traffic-map-error" role="alert">{error}</div>}
    <div className="traffic-legend" aria-label="Traffic legend"><span><i className="traffic-green" />Free</span><span><i className="traffic-yellow" />Slow</span><span><i className="traffic-red" />Congested</span></div>
  </div>;
}
