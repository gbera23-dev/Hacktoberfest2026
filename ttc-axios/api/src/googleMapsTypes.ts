export type GoogleLatLng = { latitude: number; longitude: number };

export type GoogleWaypoint = {
  address?: string;
  placeId?: string;
  location?: { latLng: GoogleLatLng };
};

export type GoogleTravelMode = "DRIVE" | "BICYCLE" | "WALK" | "TRANSIT" | "TWO_WHEELER";

export type ComputeRoutesRequest = {
  origin: GoogleWaypoint;
  destination: GoogleWaypoint;
  intermediates?: GoogleWaypoint[];
  travelMode?: GoogleTravelMode;
  computeAlternativeRoutes?: boolean;
  departureTime?: string;
  arrivalTime?: string;
  languageCode?: string;
  units?: "METRIC" | "IMPERIAL";
};

export type GoogleRoute = {
  distanceMeters?: number;
  duration?: string;
  staticDuration?: string;
  polyline?: { encodedPolyline?: string };
  legs?: Array<{
    distanceMeters?: number;
    duration?: string;
    staticDuration?: string;
    steps?: Array<{
      distanceMeters?: number;
      staticDuration?: string;
      navigationInstruction?: { instructions?: string };
      transitDetails?: Record<string, unknown>;
    }>;
  }>;
  localizedValues?: Record<string, unknown>;
};

export type ComputeRoutesResponse = {
  routes?: GoogleRoute[];
  fallbackInfo?: Record<string, unknown>;
};

export type GeocodeResult = {
  place: string;
  placeId: string;
  location: { latitude: number; longitude: number };
  granularity?: string;
  viewport?: { low: GoogleLatLng; high: GoogleLatLng };
  formattedAddress: string;
  addressComponents: Array<{ longText: string; shortText: string; types: string[]; languageCode?: string }>;
  types: string[];
};

export type GeocodeResponse = {
  results: GeocodeResult[];
};
