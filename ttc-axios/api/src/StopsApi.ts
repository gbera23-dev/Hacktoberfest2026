import type { AxiosInstance } from "axios";
import { fid } from "./http.js";
import type { Bus, BusArrival, BusStop, Locale } from "./types.js";

export class StopsApi {
  constructor(private http: AxiosInstance) {}

  /** All stops (buses, gondola, metro). Big and static: fetch once and keep it in state. */
  async list(locale?: Locale): Promise<BusStop[]> {
    return (await this.http.get<BusStop[]>("/stops", { params: { locale } })).data;
  }

  async get(stopId: string | number, locale?: Locale): Promise<BusStop> {
    return (await this.http.get<BusStop>(`/stops/${fid(stopId)}`, { params: { locale } })).data;
  }

  /** Routes that serve this stop. */
  async routes(stopId: string | number, locale?: Locale): Promise<Bus[]> {
    return (await this.http.get<Bus[]>(`/stops/${fid(stopId)}/routes`, { params: { locale } })).data;
  }

  /** Live arrival predictions. Poll every 10-15 s, not faster. */
  async arrivals(
    stopId: string | number,
    opts: { locale?: Locale; ignoreScheduled?: boolean } = {},
  ): Promise<BusArrival[]> {
    const { data } = await this.http.get<BusArrival[]>(`/stops/${fid(stopId)}/arrival-times`, {
      params: { locale: opts.locale, ignoreScheduledArrivalTimes: opts.ignoreScheduled ?? false },
    });
    return data;
  }
}
