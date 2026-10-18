import type { Bus } from "../../../../../shared/api/src/index";
import type { Labels } from "../../../shared/constants/translations";

type Props = { routes: Bus[]; selectedRoute?: Bus; labels: Labels; onSelect: (route: Bus) => void };

export function RouteList({ routes, selectedRoute, labels, onSelect }: Props) {
  return <div className="panel-list">
    <div className="list-scroll">
      {routes.map((route) => <button className={`list-item ${selectedRoute?.id === route.id ? "selected" : ""}`} key={route.id} onClick={() => onSelect(route)}>
        <span className="route-badge" style={{ background: route.color || "#0f766e" }}>{route.shortName}</span>
        <span><strong>{route.longName}</strong><small>{route.mode}</small></span>
      </button>)}
      {routes.length === 0 && <p className="muted">{labels.noData}</p>}
    </div>
  </div>;
}
