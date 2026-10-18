import type { Bus } from "../../../../../shared/api/src/index";
import type { Labels } from "../../../shared/constants/translations";
import { ErrorMessage } from "../../../shared/components/ErrorMessage";

type Props = { labels: Labels; routes: Bus[]; selectedRoute?: Bus; onSelect: (route?: Bus) => void; errors: unknown[] };

export function LiveRouteSelector({ labels, routes, selectedRoute, onSelect, errors }: Props) {
  return <div className="live-controls">
    <h2>{labels.live}</h2>
    <select value={selectedRoute?.id ?? ""} onChange={(event) => onSelect(routes.find((route) => route.id === event.target.value))}>
      <option value="">{labels.chooseRoute}</option>
      {routes.map((route) => <option value={route.id} key={route.id}>{route.shortName} · {route.longName}</option>)}
    </select>
    <p className="muted">{labels.liveRefresh}</p>
    {errors.map((error, index) => error ? <ErrorMessage error={error} key={index} /> : null)}
  </div>;
}
