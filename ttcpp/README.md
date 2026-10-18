# TTCPP — Tbilisi Transit Companion

TTCPP is a web application for exploring the Tbilisi Transport Company (TTC)
network. It combines a React and Vite frontend with a TypeScript Express API
proxy and reusable TTC API client classes.

The application supports desktop and mobile use, English and Georgian labels,
light and dark themes, responsive layouts, and live data where configured
services provide it.

## Features

- Interactive map of TTC stops, routes, and vehicle positions.
- Searchable stops and arrival times.
- Live arrival status, estimated speed, and crowding information for buses.
- Optional browser alerts for approaching and arriving buses.
- Route search with route stops, route geometry, and live positions.
- Trip planning with walking, transit, Google Routes, and Places data.
- A what-if departure simulator for comparing future departure scenarios.
- Live vehicle views and route-specific map information.
- Transit assistant chat backed by Gemini when configured.
- Netlify deployment support with a serverless API function.

## Project structure

```text
ttcpp/
├── shared/
│   └── api/src/          Reusable TTC and Google API client code
├── app/                  React and Vite frontend
│   └── src/
│       ├── app/          Application composition and global state
│       ├── features/     Plan, stops, routes, and live page packages
│       └── shared/       Shared components, hooks, overlays, and utilities
├── netlify/functions/   Serverless API entry point
├── server/              Local Express API proxy
├── test/                API and utility tests
├── mock-data/           Optional Google Maps mock responses
├── .env.example         Environment variable template
├── package.json         Scripts and dependencies
└── vite.config.ts       Frontend build configuration
```

## Requirements

- Node.js 20 or newer.
- npm.
- A TTC API key for live TTC data.
- Google Maps and Gemini API keys for the corresponding features.

## Local setup

From the `ttcpp/` directory:

```bash
npm install
cp .env.example .env
```

Add the required values to the repository-level `.env` file. The local server
reads that file from the parent directory of `ttcpp/`. Never commit real API
keys.

```dotenv
TTC_API_KEY=your-ttc-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GEMINI_API_KEY=your-gemini-api-key
WHAT_IF_API_KEY=optional-provider-key
GOOGLE_MAPS_USE_MOCK=false
```

## Development

Start the local API proxy and frontend together:

```bash
npm run dev
```

The Express proxy listens on `http://localhost:8787` and Vite serves the app
at `http://localhost:5173` by default. Vite proxies browser `/api` requests to
the local Express server.

Separate commands are also available:

```bash
npm run server       # Start only the Express proxy
npm run dev:frontend # Start only the Vite frontend
npm run dev:app      # Start proxy and frontend together
npm run preview      # Preview the production frontend build
```

## Validation and builds

Run the TypeScript check and production build with:

```bash
npm run check
npm run build
```

Run the local test suite with:

```bash
npm test
```

The live test commands make requests to external services and require network
access plus valid credentials:

```bash
npm run test:live
npm run test:google-live
```

## API client

The reusable client is exported from [`shared/api/src/index.ts`](./shared/api/src/index.ts).
It provides methods for stops, arrivals, routes, route stops, route geometry,
vehicle positions, and trip planning. The Express server adds the TTC API key
on the server side so it is not placed in the browser bundle.

The main local proxy endpoints are:

| Endpoint | Purpose |
| --- | --- |
| `/api/ttc/stops` | List TTC stops |
| `/api/ttc/stops/:id/arrival-times` | Get stop arrivals |
| `/api/ttc/stops/:id/routes` | Get routes serving a stop |
| `/api/ttc/routes` | List routes |
| `/api/ttc/routes/:id/stops` | Get stops on a route |
| `/api/ttc/routes/:id/positions` | Get live route vehicle positions |
| `/api/ttc/plan` | Request a trip plan |

The exact upstream request construction is implemented in
[`shared/api/src/TtcApi.ts`](./shared/api/src/TtcApi.ts) and the related API classes.

## Deployment

The root [`netlify.toml`](../netlify.toml) configures Netlify to build from
`ttcpp/`, publish `dist/`, and route `/api/*` requests to the serverless
function in [`netlify/functions/api.ts`](./netlify/functions/api.ts).

Configure these variables in Netlify site settings:

- `TTC_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `GEMINI_API_KEY`
- `WHAT_IF_API_KEY` when the simulator provider requires it

For the browser map, restrict the Google Maps key to the deployed domain and
enable the Maps JavaScript, Routes, and Places APIs used by the application.

## Contributing

1. Create a focused branch for the change.
2. Install dependencies with `npm install`.
3. Make the change and update documentation when behavior or configuration
   changes.
4. Run `npm run check`, `npm run build`, and the relevant tests.
5. Open a pull request with a clear description of the change.

Keep credentials out of commits and avoid changing generated build output by
hand. Source changes belong in `api/`, `app/`, `server/`, `netlify/`, or
`test/` as appropriate.
