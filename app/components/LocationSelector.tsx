"use client";

import { useState } from "react";

const locations = ["Quezon City", "San Juan", "Makati", "Pasig"];

export default function LocationSelector() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(() => typeof window === "undefined" ? "Quezon City" : window.localStorage.getItem("marketday-location") || "Quezon City");
  const [coordinates, setCoordinates] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("marketday-coordinates") || "");
  const [status, setStatus] = useState("");

  function selectLocation(value: string) {
    setLocation(value);
    setCoordinates("");
    setStatus("");
    window.localStorage.setItem("marketday-location", value);
    window.localStorage.removeItem("marketday-coordinates");
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
      () => setStatus("Location access was denied. Choose an area instead."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  function openInMaps() {
    const destination = coordinates || encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, "_blank", "noopener,noreferrer");
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
        <button className="location-maps" onClick={openInMaps}>Open in Google Maps ↗</button>
      </div>}
    </div>
  );
}
