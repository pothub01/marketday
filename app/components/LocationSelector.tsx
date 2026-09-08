"use client";

import { useEffect, useRef, useState } from "react";

type LocationValue = { address: string; lat: number; lng: number };
type MapLibreMap = import("maplibre-gl").Map;
type MapLibreMarker = import("maplibre-gl").Marker;

function parseCoordinates(value: string, fallback: [number, number]) {
  const [latitude, longitude] = value.split(",").map(Number);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] as [number, number] : fallback;
}

export default function LocationSelector({ onConfirm, allowMap = true }: { onConfirm?: (location: LocationValue) => void; allowMap?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(() => typeof window === "undefined" ? "My location" : window.localStorage.getItem("marketday-location") || "My location");
  const [coordinates, setCoordinates] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("marketday-coordinates") || "");
  const [address, setAddress] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("marketday-address") || "");
  const [confirmed, setConfirmed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("marketday-location-confirmed") === "true");
  const [status, setStatus] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | undefined>(undefined);
  const markerRef = useRef<MapLibreMarker | undefined>(undefined);
  const coordinatesRef = useRef(coordinates);

  useEffect(() => {
    coordinatesRef.current = coordinates;
  }, [coordinates]);

  useEffect(() => {
    if (!mapOpen || !mapRef.current) return;
    let disposed = false;
    let map: MapLibreMap | undefined;

    import("maplibre-gl").then((maplibre) => {
      if (disposed || !mapRef.current) return;
      const [latitude, longitude] = parseCoordinates(coordinatesRef.current, [14.5995, 120.9842]);
      const markerElement = document.createElement("div");
      markerElement.className = "delivery-pin maplibre-pin";
      markerElement.innerHTML = "<span></span>";
      map = new maplibre.Map({
        container: mapRef.current,
        center: [longitude, latitude],
        zoom: coordinatesRef.current ? 15 : 12,
        interactive: false,
        attributionControl: { compact: true },
        style: {
          version: 8,
          sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "&copy; OpenStreetMap contributors" } },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
      });
      const marker = new maplibre.Marker({ element: markerElement, anchor: "bottom" }).setLngLat([longitude, latitude]).addTo(map);
      mapInstanceRef.current = map;
      markerRef.current = marker;
      const mapElement = map.getContainer();
      mapElement.style.touchAction = "none";
      mapElement.style.overscrollBehavior = "none";
      mapElement.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
      map.once("load", () => map?.resize());
      map.on("click", async (event) => {
        const value = `${event.lngLat.lat.toFixed(5)},${event.lngLat.lng.toFixed(5)}`;
        marker.setLngLat([event.lngLat.lng, event.lngLat.lat]);
        setCoordinates(value);
        setLocation("Selected map point");
        setAddress("Finding address…");
        setConfirmed(false);
        setStatus("Finding tapped location…");
        window.localStorage.setItem("marketday-coordinates", value);
        window.localStorage.setItem("marketday-location", "Selected map point");
        window.localStorage.removeItem("marketday-location-confirmed");
        try {
          const response = await fetch(`/api/geocode?lat=${event.lngLat.lat}&lon=${event.lngLat.lng}`);
          if (!response.ok) throw new Error("Address lookup failed");
          const result = await response.json() as { display_name?: string };
          const resolvedAddress = result.display_name || value;
          setLocation(resolvedAddress);
          setAddress(resolvedAddress);
          setStatus("Point selected. Confirm this delivery location.");
          window.localStorage.setItem("marketday-location", resolvedAddress);
          window.localStorage.setItem("marketday-address", resolvedAddress);
        } catch {
          setAddress("Address unavailable");
          setStatus("Point selected, but its address could not be found.");
        }
      });
    });

    return () => {
      disposed = true;
      map?.remove();
      mapInstanceRef.current = undefined;
      markerRef.current = undefined;
    };
  }, [mapOpen]);

  async function searchLocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("location-search");
    if (!(input instanceof HTMLInputElement) || !input.value.trim()) return;
    setStatus("Searching for address…");
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(input.value.trim())}`);
      if (!response.ok) throw new Error("Search failed");
      const results = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
      const result = results[0];
      if (!result || !markerRef.current) {
        setStatus("Address not found. Try a more specific search.");
        return;
      }
      const lat = Number(result.lat);
      const lng = Number(result.lon);
      markerRef.current.setLngLat([lng, lat]);
      setLocation(result.display_name);
      setAddress(result.display_name);
      setCoordinates(`${lat.toFixed(5)},${lng.toFixed(5)}`);
      setConfirmed(false);
      setStatus("Address found. Confirm this delivery location.");
      window.localStorage.setItem("marketday-location", result.display_name);
      window.localStorage.setItem("marketday-address", result.display_name);
      window.localStorage.setItem("marketday-coordinates", `${lat.toFixed(5)},${lng.toFixed(5)}`);
      window.localStorage.removeItem("marketday-location-confirmed");
    } catch {
      setStatus("Unable to search right now. Try again.");
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Location is not supported by this browser.");
      return;
    }
    setStatus("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const value = `${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`;
        setLocation("Current location");
        setCoordinates(value);
        setAddress("");
        setConfirmed(false);
        window.localStorage.setItem("marketday-location", "Current location");
        window.localStorage.setItem("marketday-coordinates", value);
        window.localStorage.removeItem("marketday-address");
        window.localStorage.removeItem("marketday-location-confirmed");
        setStatus("Location synced.");
        if (allowMap) setMapOpen(true);
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? "Location access was denied. Allow it in your browser settings, then try again." : "Could not find your location. Try again or search for an address."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  function confirmLocation() {
    const [lat, lng] = coordinates.split(",").map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setStatus("Set a delivery location first.");
      return;
    }
    setConfirmed(true);
    setStatus("Delivery location confirmed.");
    window.localStorage.setItem("marketday-location-confirmed", "true");
    onConfirm?.({ address: address || location, lat, lng });
    setMapOpen(false);
    setOpen(false);
  }

  if (!allowMap) {
    return <div className="location-picker header-location-picker">
      <div className="location header-location" title={confirmed ? (address || location) : "Default delivery address"} aria-label={confirmed ? `Recent delivery location: ${address || location}` : "Default delivery address"}>
        <span>⌖</span> <span className="location-label">{confirmed ? (address || location) : "Default delivery address"}</span>
      </div>
    </div>;
  }

  return <div className="location-picker">
    <button className="location" title={address || location} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="dialog">
      <span>⌖</span> <span className="location-label">{address || (confirmed ? location : "Set delivery location")}</span> <b>⌄</b>
    </button>
    {open && <div className="location-menu" role="dialog" aria-label="Choose delivery area">
      <small>Delivering to</small>
      <button className="location-current" onClick={useCurrentLocation}><span>◎</span> Use my current location <b>→</b></button>
      {confirmed && coordinates && <div className="selected-location"><strong>Selected delivery location</strong><span>{address || location}</span><small>{coordinates}</small></div>}
      {status && <p className="location-status">{status}</p>}
      {allowMap && <><button className="location-maps" onClick={() => setMapOpen((value) => !value)}>{mapOpen ? "Hide map" : "Manage address on map"} <span>{mapOpen ? "⌃" : "⌄"}</span></button>
      {mapOpen && <div className="embedded-map"><form className="location-search" onSubmit={searchLocation}><input name="location-search" type="search" placeholder="Search delivery address" aria-label="Search delivery address" /><button type="submit">Search</button></form><div ref={mapRef} className="map-canvas" aria-label="Tap the map to select a delivery point" /><small>Search an address or tap the map to choose your delivery point.</small>{address && <p className="pinned-address">{address}</p>}{coordinates && <p className="pinned-coordinates">{coordinates}</p>}<button className="confirm-pin" onClick={confirmLocation} disabled={!coordinates}>Confirm delivery location</button></div>}</>}
    </div>}
  </div>;
}
