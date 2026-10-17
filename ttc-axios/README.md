# ttc-axios

Plain axios classes for the Tbilisi TTC gateway. No retries, caching or validation: add them where you need them.

The reusable API utilities are in [`api/src/`](./api/src/). The future React
application is scaffolded in [`app/src/`](./app/src/). If you are consuming
the utilities from a separate React project, copy `api/src/` into it (`npm i axios`).

The React app uses TanStack Query for caching/refetching and Leaflet for the
map. The Express server proxies same-origin `/api/ttc` requests to the TTC API
and adds the `X-Api-Key` header from `TTC_API_KEY` in the project `.env` file.
This avoids browser CORS preflight failures and keeps the token out of the
browser bundle.

## Run the app

From the repository root, make sure `.env` contains the server-only token:

```dotenv
TTC_API_KEY=your-ttc-api-key
```

Then start the application from the `ttc-axios/` directory:

```bash
npm install
npm run dev
```

`npm run dev` starts both the Express proxy on `http://localhost:8787` and the
Vite app. The app is available at `http://localhost:5173`.

The startup flow is:

1. `server/index.ts` loads `../.env` and keeps `TTC_API_KEY` on the server.
2. Express exposes the `/api/ttc/*` routes and forwards them to the TTC API.
3. Vite proxies browser requests from `/api` to Express.
4. `app/src/main.tsx` creates the shared TanStack Query client and provides it
   to the React tree.
5. `App.tsx` renders the selected feature screen; query hooks cache data and
   refresh arrivals and vehicle positions automatically.

If port `5173` is busy, Vite will choose another port; open the URL printed in
the terminal. If the app shows proxy errors, confirm the Express process is
running and that `TTC_API_KEY` is present in the repository-root `.env` file.

For a production build, run `npm run build`; deploy the Express proxy alongside
the generated `dist/` directory. `npm run test:live` makes a direct request to
the TTC API and requires network access plus a valid key.

## API

| Call | Request |
|---|---|
| `ttc.stops.list()` | `GET /stops` |
| `ttc.stops.get(id)` | `GET /stops/1:{id}` |
| `ttc.stops.routes(id)` | `GET /stops/1:{id}/routes` |
| `ttc.stops.arrivals(id, {ignoreScheduled?})` | `GET /stops/1:{id}/arrival-times` |
| `ttc.routes.list()` | `GET /routes?modes=BUS` |
| `ttc.routes.stops(routeId, forward=false)` | `GET /routes/1:{id}/stops` |
| `ttc.routes.polyline(routeId, forward=true)` | `GET /routes/1:{id}/polyline` |
| `ttc.routes.positions(routeId, forward=true)` | `GET /routes/1:{id}/positions` |
| `ttc.trips.plan([lat,lon], [lat,lon])` | `GET /plan` |

All take an optional `locale` (`"ka" | "en"`, default `"en"`; change globally with `ttc.setLocale`).
Pass bare ids; the `1:` prefix is added for you.

## API notes

`npm test` checks URLs, parameters, and headers against a local mock server.
`npm run test:live` checks the live stops response. Response types come from
the original wrapper definitions; verify the live plan shape if the upstream
API changes its time fields or duration units.
