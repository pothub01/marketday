"use client";

import { useState } from "react";

const locations = ["Quezon City", "San Juan", "Makati", "Pasig"];

export default function LocationSelector() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("Quezon City");

  return (
    <div className="location-picker">
      <button className="location" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="listbox">
        <span>⌖</span> {location} <b>⌄</b>
      </button>
      {open && <div className="location-menu" role="listbox" aria-label="Choose delivery area">
        <small>Delivering to</small>
        {locations.map((item) => <button key={item} className={item === location ? "selected" : ""} onClick={() => { setLocation(item); setOpen(false); }} role="option" aria-selected={item === location}>{item}<span>{item === location ? "✓" : "→"}</span></button>)}
      </div>}
    </div>
  );
}
