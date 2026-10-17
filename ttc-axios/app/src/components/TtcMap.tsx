import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from "react-leaflet";
import type { BusLocation, BusStop, LatLng } from "../../../api/src/index";

const TBILISI: [number, number] = [41.7151, 44.8271];

const stopIcons = {
  BUS: L.divIcon({ className: "ttc-stop-marker", html: '<span class="stop-icon stop-icon-bus" aria-label="Bus stop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v10H3V7a2 2 0 0 1 2-2Z"/><path d="M3 10h18M7 17v2m10-2v2"/><circle cx="7" cy="14" r="1.3"/><circle cx="17" cy="14" r="1.3"/></svg></span>' }),
  SUBWAY: L.divIcon({ className: "ttc-stop-marker", html: '<span class="stop-icon stop-icon-subway" aria-label="Metro stop">M</span>' }),
  GONDOLA: L.divIcon({ className: "ttc-stop-marker", html: '<span class="stop-icon stop-icon-gondola" aria-label="Gondola stop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M12 6v4"/><path d="M7 10h10l-1 7H8l-1-7Z"/><path d="M9 20h6"/></svg></span>' }),
} as const;

const modeLabels = { BUS: "Bus stop", SUBWAY: "Metro stop", GONDOLA: "Gondola stop" } as const;

function MapClick({ onPick }: { onPick?: (point: LatLng) => void }) {
  useMapEvents({ click: (event) => onPick?.([event.latlng.lat, event.latlng.lng]) });
  return null;
}

type Props = {
  stops?: BusStop[];
  routeStops?: BusStop[];
  positions?: BusLocation[];
  from?: LatLng;
  to?: LatLng;
  onPick?: (point: LatLng) => void;
};

export function TtcMap({ stops = [], routeStops = [], positions = [], from, to, onPick }: Props) {
  const routeLine = routeStops.map((stop) => [stop.lat, stop.lon] as [number, number]);
  const visibleStops = stops.length > 0 ? stops : routeStops;
  return (
    <MapContainer center={TBILISI} zoom={12} className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClick onPick={onPick} />
      <div className="map-legend" aria-label="Map legend"><span><i className="legend-icon legend-bus"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a2 2 0 0 1 2 2v10H3V7a2 2 0 0 1 2-2Z"/><circle cx="7" cy="14" r="1.3"/><circle cx="17" cy="14" r="1.3"/></svg></i>Bus</span><span><i className="legend-icon legend-subway">M</i>Metro</span><span><i className="legend-icon legend-gondola"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M12 6v4"/><path d="M7 10h10l-1 7H8l-1-7Z"/></svg></i>Gondola</span></div>
      {visibleStops.map((stop) => <Marker key={stop.id} position={[stop.lat, stop.lon]} icon={stopIcons[stop.vehicleMode]}><Popup><strong>{stop.name}</strong><br />{modeLabels[stop.vehicleMode]}{stop.code && <><br />{stop.code}</>}</Popup></Marker>)}
      {routeLine.length > 1 && <Polyline positions={routeLine} pathOptions={{ color: "#f97316", weight: 5 }} />}
      {positions.map((position, index) => <CircleMarker key={`${position.lat}-${position.lon}-${index}`} center={[position.lat, position.lon]} radius={7} pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 1 }} />)}
      {from && <CircleMarker center={from} radius={9} pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 1 }} />}
      {to && <CircleMarker center={to} radius={9} pathOptions={{ color: "#7c3aed", fillColor: "#8b5cf6", fillOpacity: 1 }} />}
    </MapContainer>
  );
}
