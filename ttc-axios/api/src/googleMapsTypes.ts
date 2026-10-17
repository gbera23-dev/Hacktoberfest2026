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
      duration?: string;
      staticDuration?: string;
      navigationInstruction?: { instructions?: string };
      transitDetails?: GoogleTransitDetails;
    }>;
  }>;
  localizedValues?: Record<string, unknown>;
};

export type GoogleTransitDetails = {
  stopDetails?: {
    arrivalStop?: { name?: string };
    departureStop?: { name?: string };
  };
  transitLine?: {
    name?: string;
    nameShort?: string;
    color?: string;
    textColor?: string;
    vehicle?: { name?: string | { text?: string }; type?: string; iconUri?: string };
  };
  headsign?: string;
  stopCount?: number;
  tripShortText?: string;
};

export type GoogleTransitStep = {
  distanceMeters?: number;
  duration?: string;
  lineName?: string;
  lineShortName?: string;
  lineColor?: string;
  lineTextColor?: string;
  vehicleName?: string;
  vehicleType?: string;
  vehicleIconUri?: string;
  headsign?: string;
  stopCount?: number;
  departureStop?: string;
  arrivalStop?: string;
};

export type GoogleTransitRoute = {
  distanceMeters?: number;
  duration?: string;
  staticDuration?: string;
  transitSteps: GoogleTransitStep[];
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

export type PlacesSearchRequest = {
  textQuery: string;
  languageCode?: string;
  regionCode?: string;
  maxResultCount?: number;
  locationBias?: { circle: { center: GoogleLatLng; radius: number } };
};

export type GooglePlace = {
  name?: string;
  id?: string;
  types?: string[];
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  location?: GoogleLatLng;
  googleMapsUri?: string;
};

export type PlacesSearchResponse = {
  places?: GooglePlace[];
};
