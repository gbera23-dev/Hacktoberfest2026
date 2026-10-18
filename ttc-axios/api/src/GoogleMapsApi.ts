import axios, { type AxiosInstance } from "axios";
import type { ComputeRoutesRequest, ComputeRoutesResponse, GeocodeResponse, GoogleRoute, GoogleRouteSummary, GoogleTransitRoute, GoogleTransitStep, PlacesSearchRequest, PlacesSearchResponse } from "./googleMapsTypes.js";
import { MOCK_GEOCODING, MOCK_PLACES, MOCK_ROUTES } from "../../mock-data/googleMaps.js";

export const GOOGLE_ROUTES_BASE_URL = "https://routes.googleapis.com";
export const GOOGLE_GEOCODING_BASE_URL = "https://geocode.googleapis.com";
export const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com";

function isRateLimited(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 429;
}

export function extractGoogleTransitSteps(route: GoogleRoute): GoogleTransitStep[] {
  return route.legs?.flatMap((leg) => leg.steps ?? []).flatMap((step) => {
    const details = step.transitDetails;
    if (!details?.transitLine) return [];
    return [{
      distanceMeters: step.distanceMeters,
      duration: step.duration,
      lineName: details.transitLine.name,
      lineShortName: details.transitLine.nameShort,
      lineColor: details.transitLine.color,
      lineTextColor: details.transitLine.textColor,
      vehicleName: typeof details.transitLine.vehicle?.name === "string" ? details.transitLine.vehicle.name : details.transitLine.vehicle?.name?.text,
      vehicleType: details.transitLine.vehicle?.type,
      vehicleIconUri: details.transitLine.vehicle?.iconUri,
      headsign: details.headsign,
      stopCount: details.stopCount,
      departureStop: details.stopDetails?.departureStop?.name,
      arrivalStop: details.stopDetails?.arrivalStop?.name,
    } satisfies GoogleTransitStep];
  }) ?? [];
}

export function summarizeGoogleTransitRoutes(response: ComputeRoutesResponse): GoogleTransitRoute[] {
  return summarizeGoogleRoutes(response);
}

export function summarizeGoogleRoutes(response: ComputeRoutesResponse): GoogleRouteSummary[] {
  return (response.routes ?? []).map((route) => ({
    distanceMeters: route.distanceMeters,
    duration: route.duration,
    staticDuration: route.staticDuration,
    transitSteps: extractGoogleTransitSteps(route),
  }));
}

export type GoogleMapsOptions = {
  apiKey: string;
  routesBaseUrl?: string;
  geocodingBaseUrl?: string;
  placesBaseUrl?: string;
  timeoutMs?: number;
  useMockFallback?: boolean;
};

export class GoogleMapsApi {
  readonly routes: {
    compute: (request: ComputeRoutesRequest) => Promise<ComputeRoutesResponse>;
  };
  readonly geocoding: {
    geocode: (address: string, options?: { language?: string; region?: string }) => Promise<GeocodeResponse>;
  };
  readonly places: {
    search: (request: PlacesSearchRequest) => Promise<PlacesSearchResponse>;
  };

  private readonly routesHttp: AxiosInstance;
  private readonly geocodingHttp: AxiosInstance;
  private readonly placesHttp: AxiosInstance;
  private readonly apiKey: string;
  private readonly useMockFallback: boolean;

  constructor(options: GoogleMapsOptions) {
    if (!options.apiKey) throw new Error("GOOGLE_MAPS_API_KEY is required");
    this.apiKey = options.apiKey;
    this.useMockFallback = options.useMockFallback ?? false;
    this.routesHttp = axios.create({ baseURL: options.routesBaseUrl ?? GOOGLE_ROUTES_BASE_URL, timeout: options.timeoutMs ?? 10_000 });
    this.geocodingHttp = axios.create({ baseURL: options.geocodingBaseUrl ?? GOOGLE_GEOCODING_BASE_URL, timeout: options.timeoutMs ?? 10_000 });
    this.placesHttp = axios.create({ baseURL: options.placesBaseUrl ?? GOOGLE_PLACES_BASE_URL, timeout: options.timeoutMs ?? 10_000 });
    this.routes = { compute: (request) => this.computeRoutes(request) };
    this.geocoding = { geocode: (address, requestOptions) => this.geocode(address, requestOptions) };
    this.places = { search: (request) => this.searchPlaces(request) };
  }

  private async searchPlaces(request: PlacesSearchRequest): Promise<PlacesSearchResponse> {
    try {
      const { data } = await this.placesHttp.post<PlacesSearchResponse>("/v1/places:searchText", request, {
        headers: {
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": "places.name,places.id,places.types,places.displayName,places.formattedAddress,places.location,places.googleMapsUri",
        },
      });
      return data;
    } catch (error) {
      if (this.useMockFallback || isRateLimited(error)) {
        const needle = request.textQuery.toLocaleLowerCase();
        const match = Object.entries(MOCK_PLACES).find(([name]) => needle.includes(name.toLocaleLowerCase()) || name.toLocaleLowerCase().includes(needle));
        if (match) return { places: [match[1]] };
      }
      throw error;
    }
  }

  private async computeRoutes(request: ComputeRoutesRequest): Promise<ComputeRoutesResponse> {
    try {
      const { data } = await this.routesHttp.post<ComputeRoutesResponse>("/directions/v2:computeRoutes", {
        ...request,
        travelMode: request.travelMode ?? "TRANSIT",
        computeAlternativeRoutes: request.computeAlternativeRoutes ?? true,
      }, {
        headers: {
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.staticDuration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.staticDuration,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.navigationInstruction,routes.legs.steps.transitDetails,fallbackInfo",
        },
      });
      return data;
    } catch (error) {
      if (this.useMockFallback || isRateLimited(error)) return MOCK_ROUTES;
      throw error;
    }
  }

  private async geocode(address: string, options: { language?: string; region?: string } = {}): Promise<GeocodeResponse> {
    try {
      const { data } = await this.geocodingHttp.get<GeocodeResponse>(`/v4/geocode/address/${encodeURIComponent(address)}`, {
        params: { languageCode: options.language ?? "en", regionCode: options.region ?? "ge" },
        headers: { "X-Goog-Api-Key": this.apiKey },
      });
      return data;
    } catch (error) {
      if (this.useMockFallback || isRateLimited(error)) {
        const match = Object.entries(MOCK_GEOCODING).find(([name]) => address.toLocaleLowerCase().includes(name.toLocaleLowerCase()));
        if (match) return match[1];
      }
      throw error;
    }
  }
}
