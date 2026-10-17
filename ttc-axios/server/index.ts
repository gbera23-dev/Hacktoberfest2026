import cors from "cors";
import express, { type Request } from "express";
import { TtcApi, type LatLng, type Locale } from "../api/src/index.js";

const apiKey = process.env.TTC_API_KEY;
if (!apiKey) throw new Error("TTC_API_KEY is required");

const app = express();
const port = Number(process.env.PORT ?? 8787);
const ttc = new TtcApi({ apiKey });

app.use(cors({ origin: process.env.APP_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

const locale = (req: Request): Locale | undefined => {
  const value = req.query.locale;
  return value === "ka" || value === "en" ? value : undefined;
};

const id = (value: string) => value.replace(/^1:/, "");

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/ttc/stops", async (req, res, next) => {
  try { res.json(await ttc.stops.list(locale(req))); } catch (error) { next(error); }
});

app.get("/api/ttc/stops/:stopId", async (req, res, next) => {
  try { res.json(await ttc.stops.get(id(req.params.stopId), locale(req))); } catch (error) { next(error); }
});

app.get("/api/ttc/stops/:stopId/routes", async (req, res, next) => {
  try { res.json(await ttc.stops.routes(id(req.params.stopId), locale(req))); } catch (error) { next(error); }
});

app.get("/api/ttc/stops/:stopId/arrival-times", async (req, res, next) => {
  try {
    res.json(await ttc.stops.arrivals(id(req.params.stopId), {
      locale: locale(req),
      ignoreScheduled: req.query.ignoreScheduled === "true",
    }));
  } catch (error) { next(error); }
});

app.get("/api/ttc/routes", async (req, res, next) => {
  try { res.json(await ttc.routes.list(locale(req))); } catch (error) { next(error); }
});

app.get("/api/ttc/routes/:routeId/stops", async (req, res, next) => {
  try { res.json(await ttc.routes.stops(id(req.params.routeId), req.query.forward !== "false", locale(req))); } catch (error) { next(error); }
});

app.get("/api/ttc/routes/:routeId/polyline", async (req, res, next) => {
  try { res.json(await ttc.routes.polyline(id(req.params.routeId), req.query.forward !== "false")); } catch (error) { next(error); }
});

app.get("/api/ttc/routes/:routeId/positions", async (req, res, next) => {
  try { res.json(await ttc.routes.positions(id(req.params.routeId), req.query.forward !== "false")); } catch (error) { next(error); }
});

app.get("/api/ttc/plan", async (req, res, next) => {
  try {
    const from = String(req.query.fromPlace ?? "").split(",").map(Number) as LatLng;
    const to = String(req.query.toPlace ?? "").split(",").map(Number) as LatLng;
    if (from.length !== 2 || to.length !== 2 || [...from, ...to].some(Number.isNaN)) {
      res.status(400).json({ message: "fromPlace and toPlace must be lat,lon coordinates" });
      return;
    }
    res.json(await ttc.trips.plan(from, to, locale(req)));
  } catch (error) { next(error); }
});

app.use((error: unknown, _req: Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "TTC request failed";
  res.status(502).json({ message });
});

app.listen(port, () => console.log(`TTC proxy listening on http://localhost:${port}`));
