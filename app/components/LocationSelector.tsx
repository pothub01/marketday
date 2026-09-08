"use client";

import { useEffect, useRef, useState } from "react";

function parseCoordinates(value: string, fallback: [number, number]) {
  const [latitude, longitude] = value.split(",").map(Number);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] as [number, number] : fallback;
}

export default function LocationSelector() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(() => typeof window === "undefined" ? "My location" : window.localStorage.getItem("marketday-location") || "My location");
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
      const fallback: [number, number] = [14.5995, 120.9842];
      const center = parseCoordinates(coordinatesRef.current, fallback);
      map = leaflet.map(mapRef.current, { zoomControl: true }).setView(center, coordinatesRef.current ? 16 : 13);
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      const pin = leaflet.marker(center, {
        draggable: true,
        icon: leaflet.divIcon({ className: "delivery-pin", html: "<span>●</span>", iconSize: [28, 28], iconAnchor: [14, 28] }),
      }).addTo(map);

      const savePin = (position: import("leaflet").LatLng) => {
        pin.setLatLng(position);
        const pinPosition = pin.getLatLng();
        const value = `${pinPosition.lat.toFixed(5)},${pinPosition.lng.toFixed(5)}`;
        setLocation("Pinned location");
        setCoordinates(value);
        setStatus("Pinned delivery location saved.");
        window.localStorage.setItem("marketday-location", "Pinned location");
        window.localStorage.setItem("marketday-coordinates", value);
      };

      pin.on("dragend", () => savePin(pin.getLatLng()));
      map.on("click", (event) => savePin(event.latlng));
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [mapOpen]);

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
        setMapOpen(true);
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED
        ? "Location access was denied. Allow it in your browser settings, then try again."
        : "Could not find your location. Try again or place the pin on the map."),
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
        {status && <p className="location-status">{status}</p>}
        <button className="location-maps" onClick={() => setMapOpen((value) => !value)}>{mapOpen ? "Hide map" : "View delivery map"} <span>{mapOpen ? "⌃" : "⌄"}</span></button>
        {mapOpen && <div className="embedded-map"><div ref={mapRef} className="map-canvas" /><small>Drag the pin or tap the map to set your delivery location.</small>{coordinates && <p className="pinned-coordinates">{coordinates}</p>}<button className="confirm-pin" onClick={() => { setMapOpen(false); setOpen(false); }}>Confirm delivery location</button></div>}
      </div>}
    </div>
  );
}
