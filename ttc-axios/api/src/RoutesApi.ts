import type { AxiosInstance } from "axios";
import { fid } from "./http.js";
import type { Bus, BusLocation, BusStop, Locale, Polyline } from "./types.js";

export class RoutesApi {
  constructor(private http: AxiosInstance) {}

  /** All bus routes. */
  async list(locale?: Locale): Promise<Bus[]> {
    return (await this.http.get<Bus[]>("/routes", { params: { locale, modes: "BUS" } })).data;
  }

  /** Ordered stops of a route. forward=false is the return direction. */
  async stops(routeId: string | number, forward = false, locale?: Locale): Promise<BusStop[]> {
    return (await this.http.get<BusStop[]>(`/routes/${fid(routeId)}/stops`, { params: { locale, forward } })).data;
  }

  /** Encoded polyline of the route's path, for drawing on a map. */
  async polyline(routeId: string | number, forward = true): Promise<Polyline> {
    return (await this.http.get<Polyline>(`/routes/${fid(routeId)}/polyline`, { params: { forward } })).data;
  }

  /** Live bus positions on a route. */
  async positions(routeId: string | number, forward = true): Promise<BusLocation[]> {
    return (await this.http.get<BusLocation[]>(`/routes/${fid(routeId)}/positions`, { params: { forward } })).data;
  }
}
