import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";
import type { BusLocation, BusStop, LatLng } from "../../../../shared/api/src/index";
import { GoogleTrafficMap } from "./GoogleTrafficMap";

const TBILISI: [number, number] = [41.7151, 44.8271];

const stopIcons = {
  BUS: L.divIcon({ className: "ttc-stop-marker", html: '<span class="stop-icon stop-icon-bus" aria-label="Bus stop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v10H3V7a2 2 0 0 1 2-2Z"/><path d="M3 10h18M7 17v2m10-2v2"/><circle cx="7" cy="14" r="1.3"/><circle cx="17" cy="14" r="1.3"/></svg></span>' }),
  SUBWAY: L.divIcon({ className: "ttc-stop-marker", html: '<span class="stop-icon stop-icon-subway" aria-label="Metro stop">M</span>' }),
  GONDOLA: L.divIcon({ className: "ttc-stop-marker", html: '<span class="stop-icon stop-icon-gondola" aria-label="Gondola stop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M12 6v4"/><path d="M7 10h10l-1 7H8l-1-7Z"/><path d="M9 20h6"/></svg></span>' }),
} as const;

const mapText = {
  en: { bus: "Bus", metro: "Metro", gondola: "Gondola", busStop: "Bus stop", metroStop: "Metro stop", gondolaStop: "Gondola stop", traffic: "Live traffic", locate: "My location", locating: "Locating", locationUnsupported: "Location is not supported by this browser.", permissionDenied: "Location permission was denied.", locationFailed: "Could not determine your location.", yourLocation: "Your location", mapLegend: "Map legend" },
  ka: { bus: "ავტობუსი", metro: "მეტრო", gondola: "გონდოლა", busStop: "ავტობუსის გაჩერება", metroStop: "მეტროს გაჩერება", gondolaStop: "გონდოლას გაჩერება", traffic: "რეალური მოძრაობა", locate: "ჩემი მდებარეობა", locating: "მოძიება", locationUnsupported: "ამ ბრაუზერს მდებარეობის მხარდაჭერა არ აქვს.", permissionDenied: "მდებარეობის წვდომა უარყოფილია.", locationFailed: "მდებარეობის დადგენა ვერ მოხერხდა.", yourLocation: "თქვენი მდებარეობა", mapLegend: "რუკის ლეგენდა" },
} as const;

function MapClick({ onPick }: { onPick?: (point: LatLng) => void }) {
  useMapEvents({ click: (event) => onPick?.([event.latlng.lat, event.latlng.lng]) });
  return null;
}

function MapViewport({ onChange }: { onChange: (center: LatLng, zoom: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onChange([center.lat, center.lng], map.getZoom());
    },
    zoomend: () => {
      const center = map.getCenter();
      onChange([center.lat, center.lng], map.getZoom());
    },
  });
  return null;
}

function MapSizeSync() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const refresh = () => map.invalidateSize({ pan: false, debounceMoveend: true });
    refresh();
    const observer = new ResizeObserver(refresh);
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function RecenterMap({ point }: { point?: LatLng }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo(point, Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [map, point]);
  return null;
}

type Props = {
  className?: string;
  locale?: "en" | "ka";
  stops?: BusStop[];
  routeStops?: BusStop[];
  positions?: BusLocation[];
  from?: LatLng;
  to?: LatLng;
  onPick?: (point: LatLng) => void;
  onStopSelect?: (stop: BusStop) => void;
  trafficEnabled?: boolean;
  onTrafficChange?: (enabled: boolean) => void;
};

export function TtcMap({ className, locale = typeof document !== "undefined" && document.documentElement.lang === "ka" ? "ka" : "en", stops = [], routeStops = [], positions = [], from, to, onPick, onStopSelect, trafficEnabled = false, onTrafficChange }: Props) {
  const labels = mapText[locale];
  const modeLabels = { BUS: labels.busStop, SUBWAY: labels.metroStop, GONDOLA: labels.gondolaStop } as const;
  const routeLine = routeStops.map((stop) => [stop.lat, stop.lon] as [number, number]);
  const visibleStops = stops.length > 0 ? stops : routeStops;
  const [viewport, setViewport] = useState<{ center: LatLng; zoom: number }>({ center: TBILISI, zoom: 12 });
  const [userLocation, setUserLocation] = useState<LatLng>();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>();
  const locateUser = () => {
    if (!navigator.geolocation) { setLocationError(labels.locationUnsupported); return; }
    setLocating(true);
    setLocationError(undefined);
    navigator.geolocation.getCurrentPosition(
      (position) => { setUserLocation([position.coords.latitude, position.coords.longitude]); setLocating(false); },
      (error) => { setLocationError(error.code === error.PERMISSION_DENIED ? labels.permissionDenied : labels.locationFailed); setLocating(false); },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    );
  };
  const updateViewport = (center: LatLng, zoom: number) => setViewport({ center, zoom });
  return <div className={`map-shell${className ? ` ${className}` : ""}`}>
    <label className={`traffic-toggle ${trafficEnabled ? "google" : "leaflet"}`}><input type="checkbox" checked={trafficEnabled} onChange={(event) => onTrafficChange?.(event.target.checked)} /> <span>{labels.traffic}</span></label>
    <button className="location-control" type="button" onClick={locateUser} disabled={locating} aria-label={labels.locate}>{locating ? "…" : "◎"} <span>{locating ? labels.locating : labels.locate}</span></button>
    {locationError && <p className="location-error" role="alert">{locationError}</p>}
    {trafficEnabled ? <GoogleTrafficMap center={viewport.center} zoom={viewport.zoom} onViewportChange={updateViewport} userLocation={userLocation} locale={locale} /> : <MapContainer center={viewport.center} zoom={viewport.zoom} className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport onChange={updateViewport} />
      <MapSizeSync />
      <RecenterMap point={userLocation} />
      <MapClick onPick={onPick} />
      <div className="map-legend" aria-label={labels.mapLegend}><span><i className="legend-icon legend-bus"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v10H3V7a2 2 0 0 1 2-2Z"/><circle cx="7" cy="14" r="1.3"/><circle cx="17" cy="14" r="1.3"/></svg></i>{labels.bus}</span><span><i className="legend-icon legend-subway">M</i>{labels.metro}</span><span><i className="legend-icon legend-gondola"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M12 6v4"/><path d="M7 10h10l-1 7H8l-1-7Z"/></svg></i>{labels.gondola}</span></div>
      {visibleStops.map((stop, index) => <Marker key={`${stop.id}-${index}`} position={[stop.lat, stop.lon]} icon={stopIcons[stop.vehicleMode]} eventHandlers={{ click: () => onStopSelect?.(stop) }}><Popup><strong>{stop.name}</strong><br />{modeLabels[stop.vehicleMode]}{stop.code && <><br />{stop.code}</>}</Popup></Marker>)}
      {routeLine.length > 1 && <Polyline positions={routeLine} pathOptions={{ color: "#f97316", weight: 5 }} />}
      {positions.map((position, index) => <CircleMarker key={`${position.lat}-${position.lon}-${index}`} center={[position.lat, position.lon]} radius={7} pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 1 }} />)}
      {from && <CircleMarker center={from} radius={9} pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 1 }} />}
      {to && <CircleMarker center={to} radius={9} pathOptions={{ color: "#7c3aed", fillColor: "#8b5cf6", fillOpacity: 1 }} />}
      {userLocation && <><CircleMarker center={userLocation} radius={10} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }} /><CircleMarker center={userLocation} radius={18} pathOptions={{ color: "#2563eb", weight: 2, fillColor: "#60a5fa", fillOpacity: 0.18 }}><Popup>{labels.yourLocation}</Popup></CircleMarker></>}
    </MapContainer>}
  </div>;
}
