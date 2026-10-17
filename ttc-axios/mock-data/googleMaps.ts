import type { ComputeRoutesResponse, GeocodeResponse, GooglePlace } from "../api/src/googleMapsTypes.js";

export const MOCK_GEOCODING: Record<string, GeocodeResponse> = {
  "Didube Metro Station": { results: [{ place: "places/mock-didube-metro", placeId: "mock-didube-metro", formattedAddress: "Didube Metro Station, Tbilisi, Georgia", location: { latitude: 41.7497, longitude: 44.7798 }, addressComponents: [], types: ["transit_station"] }] },
  "Free University of Tbilisi": { results: [{ place: "places/mock-free-university", placeId: "mock-free-university", formattedAddress: "#240 Davit Aghmashenebeli Ave, Tbilisi, Georgia", location: { latitude: 41.8057235, longitude: 44.7679149 }, addressComponents: [], types: ["university"] }] },
  "Tbilisi Mall": { results: [{ place: "places/mock-tbilisi-mall", placeId: "mock-tbilisi-mall", formattedAddress: "Tbilisi Mall, Tbilisi, Georgia", location: { latitude: 41.8153, longitude: 44.7721 }, addressComponents: [], types: ["shopping_mall"] }] },
  "Freedom Square, Tbilisi": { results: [{ place: "places/mock-freedom-square", placeId: "mock-freedom-square", formattedAddress: "Freedom Square, Tbilisi, Georgia", location: { latitude: 41.6938, longitude: 44.8015 }, addressComponents: [], types: ["point_of_interest"] }] },
  "Tbilisi International Airport": { results: [{ place: "places/mock-tbilisi-airport", placeId: "mock-tbilisi-airport", formattedAddress: "Tbilisi International Airport, Tbilisi, Georgia", location: { latitude: 41.6692, longitude: 44.9547 }, addressComponents: [], types: ["airport"] }] },
};

export const MOCK_ROUTES: ComputeRoutesResponse = {
  routes: [
    { distanceMeters: 6400, duration: "1800s", staticDuration: "2100s", legs: [{ distanceMeters: 6400, duration: "1800s", staticDuration: "2100s" }] },
    { distanceMeters: 7100, duration: "2100s", staticDuration: "2280s", legs: [{ distanceMeters: 7100, duration: "2100s", staticDuration: "2280s" }] },
    { distanceMeters: 8200, duration: "2400s", staticDuration: "2520s", legs: [{ distanceMeters: 8200, duration: "2400s", staticDuration: "2520s" }] },
    { distanceMeters: 9300, duration: "2700s", staticDuration: "2880s", legs: [{ distanceMeters: 9300, duration: "2700s", staticDuration: "2880s" }] },
  ],
  fallbackInfo: { reason: "MOCK_DATA" },
};

export const MOCK_PLACES: Record<string, GooglePlace> = {
  "free university": { name: "places/mock-free-university", id: "mock-free-university", displayName: { text: "Free University of Tbilisi", languageCode: "en" }, formattedAddress: "#240 Davit Aghmashenebeli Ave, Tbilisi, Georgia", location: { latitude: 41.8057235, longitude: 44.7679149 }, types: ["university"] },
  "tbilisi mall": { name: "places/mock-tbilisi-mall", id: "mock-tbilisi-mall", displayName: { text: "Tbilisi Mall", languageCode: "en" }, formattedAddress: "Tbilisi Mall, Tbilisi, Georgia", location: { latitude: 41.8153, longitude: 44.7721 }, types: ["shopping_mall"] },
  "freedom square": { name: "places/mock-freedom-square", id: "mock-freedom-square", displayName: { text: "Freedom Square", languageCode: "en" }, formattedAddress: "Freedom Square, Tbilisi, Georgia", location: { latitude: 41.6938, longitude: 44.8015 }, types: ["tourist_attraction", "point_of_interest"] },
};
