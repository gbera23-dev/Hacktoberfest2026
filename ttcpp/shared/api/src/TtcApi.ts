import { createHttp, type TtcOptions } from "./http.js";
import { RoutesApi } from "./RoutesApi.js";
import { StopsApi } from "./StopsApi.js";
import { TripsApi } from "./TripsApi.js";
import type { Locale } from "./types.js";

/** One object for the whole API:  const ttc = new TtcApi({ apiKey });  ttc.stops.arrivals("1946") */
export class TtcApi {
  readonly stops: StopsApi;
  readonly routes: RoutesApi;
  readonly trips: TripsApi;
  private handle;

  constructor(opts: TtcOptions = {}) {
    this.handle = createHttp(opts);
    this.stops = new StopsApi(this.handle.http);
    this.routes = new RoutesApi(this.handle.http);
    this.trips = new TripsApi(this.handle.http);
  }

  setLocale(l: Locale) { this.handle.setLocale(l); }
}
