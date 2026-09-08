"use client";

import { useState } from "react";
import Link from "next/link";
import AuthModal from "./AuthModal";
import AuthStatus from "./AuthStatus";
import LocationSelector from "./LocationSelector";
export default function RouteHeader({ active }: { active: "shop" | "orders" | "account" }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return <>
    <div className="announcement"><span>✦</span> Free delivery on orders over ₱1,000 <span>•</span> Same-day delivery until 5 PM</div>
    <header className="header">
      <Link className="brand" href="/"><span className="brand-mark">m</span><span>marketday<span className="brand-dot">.</span></span></Link>
      <button className="mobile-menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen}>☰</button>
      <nav className={`main-nav ${menuOpen ? "menu-open" : ""}`}><Link onClick={() => setMenuOpen(false)} className={active === "shop" ? "active" : ""} href="/">Shop</Link><Link onClick={() => setMenuOpen(false)} className={active === "orders" ? "active" : ""} href="/orders">My orders</Link><Link onClick={() => setMenuOpen(false)} className={active === "account" ? "active" : ""} href="/account">Account</Link></nav>
      <div className="header-actions"><LocationSelector allowMap={false} /><AuthStatus onSignIn={() => setAuthOpen(true)} /><Link className="cart-button" href="/checkout"><span>Cart</span><b>0</b></Link></div>
    </header>
    {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
  </>;
}

export function RouteFooter() {
  return <footer><div className="footer-brand"><span className="brand-mark">m</span><span>marketday<span className="brand-dot">.</span></span></div><p>Good food starts at the market.</p><div className="footer-links"><span>About</span><span>Help center</span><span>Delivery areas</span><Link href="/admin">Admin preview</Link></div></footer>;
}
