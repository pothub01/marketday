"use client";

import { useEffect, useRef, useState } from "react";

const locations = ["Quezon City", "San Juan", "Makati", "Pasig"];
const locationCoordinates: Record<string, [number, number]> = {
  "Quezon City": [14.676, 121.0437],
  "San Juan": [14.6019, 121.0355],
  Makati: [14.5547, 121.0244],
  Pasig: [14.5764, 121.0851],
};

function parseCoordinates(value: string, fallback: [number, number]) {
  const [latitude, longitude] = value.split(",").map(Number);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] as [number, number] : fallback;
}

export default function LocationSelector() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(() => typeof window === "undefined" ? "Quezon City" : window.localStorage.getItem("marketday-location") || "Quezon City");
  const [coordinates, setCoordinates] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("marketday-coordinates") || "");
  const [status, setStatus] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef(location);
  const coordinatesRef = useRef(coordinates);

  useEffect(() => {
    locationRef.current = location;
    coordinatesRef.current = coordinates;
  }, [location, coordinates]);

  useEffect(() => {
    if (!mapOpen || !mapRef.current) return;

    let disposed = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((leaflet) => {
      if (disposed || !mapRef.current) return;
      const fallback = locationCoordinates[locationRef.current] || locationCoordinates["Quezon City"];
      const center = parseCoordinates(coordinatesRef.current, fallback);
      map = leaflet.map(mapRef.current, { zoomControl: true }).setView(center, coordinatesRef.current ? 16 : 13);
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      const pin = leaflet.marker(center, {
        draggable: true,
        icon: leaflet.divIcon({ className: "delivery-pin", html: "<span>●</span>", iconSize: [28, 28], iconAnchor: [14, 28] }),
      }).addTo(map);

      pin.on("dragend", () => {
        const position = pin.getLatLng();
        const value = `${position.lat.toFixed(5)},${position.lng.toFixed(5)}`;
        setLocation("Pinned location");
        setCoordinates(value);
        setStatus("Pinned delivery location saved.");
        window.localStorage.setItem("marketday-location", "Pinned location");
        window.localStorage.setItem("marketday-coordinates", value);
      });
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [mapOpen]);

  function selectLocation(value: string) {
    setLocation(value);
    setCoordinates("");
    setStatus("");
    window.localStorage.setItem("marketday-location", value);
    window.localStorage.removeItem("marketday-coordinates");
    setMapOpen(false);
    setOpen(false);
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
        window.localStorage.setItem("marketday-location", "Current location");
        window.localStorage.setItem("marketday-coordinates", value);
        setStatus("Location synced.");
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED
        ? "Location access was denied. Allow it in your browser settings, then try again."
        : "Could not find your location. Choose an area instead."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <div className="location-picker">
      <button className="location" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="listbox">
        <span>⌖</span> {location} <b>⌄</b>
      </button>
      {open && <div className="location-menu" role="listbox" aria-label="Choose delivery area">
        <small>Delivering to</small>
        <button className="location-current" onClick={useCurrentLocation}><span>◎</span> Use my current location <b>→</b></button>
        {locations.map((item) => <button key={item} className={item === location ? "selected" : ""} onClick={() => selectLocation(item)} role="option" aria-selected={item === location}>{item}<span>{item === location ? "✓" : "→"}</span></button>)}
        {status && <p className="location-status">{status}</p>}
        <button className="location-maps" onClick={() => setMapOpen((value) => !value)}>{mapOpen ? "Hide map" : "View delivery map"} <span>{mapOpen ? "⌃" : "⌄"}</span></button>
        {mapOpen && <div className="embedded-map"><div ref={mapRef} className="map-canvas" /><small>Drag the pin to your exact delivery location.</small>{coordinates && <p className="pinned-coordinates">{coordinates}</p>}<button className="confirm-pin" onClick={() => { setMapOpen(false); setOpen(false); }}>Confirm delivery pin</button></div>}
      </div>}
    </div>
  );
}
