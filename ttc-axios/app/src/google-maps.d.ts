declare global {
  const __GOOGLE_MAPS_API_KEY__: string;
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: { center: { lat: number; lng: number }; zoom: number }) => {
          setCenter: (center: { lat: number; lng: number }) => void;
          setZoom: (zoom: number) => void;
          getCenter: () => { lat: () => number; lng: () => number };
          getZoom: () => number;
          addListener: (event: string, handler: () => void) => { remove: () => void };
        };
        TrafficLayer: new () => { setMap: (map: unknown | null) => void };
      };
    };
  }
}

export {};
