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
  const [address, setAddress] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("marketday-address") || "");
  const [confirmed, setConfirmed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("marketday-location-confirmed") === "true");
  const [status, setStatus] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef(location);
  const coordinatesRef = useRef(coordinates);
  const addressRef = useRef(address);

  useEffect(() => {
    locationRef.current = location;
    coordinatesRef.current = coordinates;
    addressRef.current = address;
  }, [location, coordinates, address]);

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
        icon: leaflet.divIcon({ className: "delivery-pin", html: "<span></span>", iconSize: [32, 40], iconAnchor: [16, 40] }),
      }).addTo(map);
      const popup = leaflet.popup({ closeButton: false, offset: [0, -34] }).setContent(addressRef.current || "Move this pin to set your delivery location.");
      pin.bindPopup(popup).openPopup();

      const savePin = (position: import("leaflet").LatLng) => {
        pin.setLatLng(position);
        const pinPosition = pin.getLatLng();
        const value = `${pinPosition.lat.toFixed(5)},${pinPosition.lng.toFixed(5)}`;
        setLocation("Pinned location");
        setCoordinates(value);
        setConfirmed(false);
        setAddress("Finding address…");
        setStatus("Finding pinned address…");
        window.localStorage.setItem("marketday-location", "Pinned location");
        window.localStorage.setItem("marketday-coordinates", value);
        window.localStorage.removeItem("marketday-location-confirmed");
        popup.setContent("Finding address…").openOn(map as import("leaflet").Map);
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pinPosition.lat}&lon=${pinPosition.lng}`)
          .then((response) => response.ok ? response.json() : Promise.reject(new Error("Address lookup failed")))
          .then((result: { display_name?: string }) => {
            const resolvedAddress = result.display_name || value;
            setLocation(resolvedAddress);
            setAddress(resolvedAddress);
            setStatus("Pinned delivery location saved.");
            window.localStorage.setItem("marketday-location", resolvedAddress);
            window.localStorage.setItem("marketday-address", resolvedAddress);
            popup.setContent(resolvedAddress).openOn(map as import("leaflet").Map);
          })
          .catch(() => {
            setAddress("Address unavailable");
            setStatus("Pin saved, but the address could not be found.");
            window.localStorage.removeItem("marketday-address");
            popup.setContent("Address unavailable").openOn(map as import("leaflet").Map);
          });
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
        setAddress("");
        setConfirmed(false);
        window.localStorage.setItem("marketday-location", "Current location");
        window.localStorage.setItem("marketday-coordinates", value);
        window.localStorage.removeItem("marketday-address");
        window.localStorage.removeItem("marketday-location-confirmed");
        setStatus("Location synced.");
        setMapOpen(true);
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED
        ? "Location access was denied. Allow it in your browser settings, then try again."
        : "Could not find your location. Try again or place the pin on the map."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  function confirmLocation() {
    if (!coordinates) {
      setStatus("Set a delivery pin first.");
      return;
    }
    setStatus("Delivery location confirmed.");
    setConfirmed(true);
    window.localStorage.setItem("marketday-location-confirmed", "true");
    setMapOpen(false);
    setOpen(false);
  }

  return (
    <div className="location-picker">
      <button className="location" title={address || location} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="listbox">
        <span>⌖</span> <span className="location-label">{address || location}</span> <b>⌄</b>
      </button>
      {open && <div className="location-menu" role="listbox" aria-label="Choose delivery area">
        <small>Delivering to</small>
        <button className="location-current" onClick={useCurrentLocation}><span>◎</span> Use my current location <b>→</b></button>
        {confirmed && coordinates && <div className="selected-location"><strong>Selected delivery location</strong><span>{address || location}</span><small>{coordinates}</small></div>}
        {status && <p className="location-status">{status}</p>}
        <button className="location-maps" onClick={() => setMapOpen((value) => !value)}>{mapOpen ? "Hide map" : "Set delivery address on map"} <span>{mapOpen ? "⌃" : "⌄"}</span></button>
        {mapOpen && <div className="embedded-map"><div ref={mapRef} className="map-canvas" /><small>Drag the pin or tap the map to set your delivery location.</small>{address && <p className="pinned-address">{address}</p>}{coordinates && <p className="pinned-coordinates">{coordinates}</p>}<button className="confirm-pin" onClick={confirmLocation} disabled={!coordinates}>Confirm delivery location</button></div>}
      </div>}
    </div>
  );
}
