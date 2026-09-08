"use client";

import { useState } from "react";
import Link from "next/link";
import LocationSelector from "./LocationSelector";
import AuthModal from "./AuthModal";
export default function RouteHeader({ active }: { active: "shop" | "orders" | "account" }) {
  const [authOpen, setAuthOpen] = useState(false);
  return <>
    <div className="announcement"><span>✦</span> Free delivery on orders over ₱1,000 <span>•</span> Same-day delivery until 5 PM</div>
    <header className="header">
      <Link className="brand" href="/"><span className="brand-mark">m</span><span>marketday<span className="brand-dot">.</span></span></Link>
      <nav className="main-nav"><Link className={active === "shop" ? "active" : ""} href="/">Shop</Link><Link className={active === "orders" ? "active" : ""} href="/orders">My orders</Link><Link className={active === "account" ? "active" : ""} href="/account">Account</Link></nav>
      <div className="header-actions"><LocationSelector /><button className="sign-in-link" onClick={() => setAuthOpen(true)}>Sign in</button><Link className="cart-button" href="/checkout"><span>Cart</span><b>0</b></Link></div>
    </header>
    {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
  </>;
}

export function RouteFooter() {
  return <footer><div className="footer-brand"><span className="brand-mark">m</span><span>marketday<span className="brand-dot">.</span></span></div><p>Good food starts at the market.</p><div className="footer-links"><span>About</span><span>Help center</span><span>Delivery areas</span><Link href="/admin">Admin preview</Link></div></footer>;
}
