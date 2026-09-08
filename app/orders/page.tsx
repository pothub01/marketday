"use client";

import { useEffect, useState } from "react";
import RouteHeader, { RouteFooter } from "../components/RouteHeader";
import AuthModal from "../components/AuthModal";
import { supabase } from "../../lib/supabase";

export default function OrdersPage() {
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signedIn = Boolean(user);
  return <main className="app"><RouteHeader active="orders" /><section className="simple-page"><div className="page-title"><span className="kicker">Your marketday</span><h1>Orders &amp; delivery</h1><p>{signedIn ? "Track your active orders, delivery updates, and order history." : "Sign in to view your active orders, delivery updates, and order history."}</p></div>{loading ? <div className="guest-card order-guest"><h2>Loading your orders…</h2></div> : <div className="guest-card order-guest"><div className="guest-icon">⌁</div><h2>{signedIn ? "No orders yet" : "Sign in to view orders"}</h2><p>{signedIn ? "Your orders and delivery tracking will appear here after you place your first Marketday order." : "Your orders and delivery tracking will appear here after you sign in and place your first Marketday order."}</p>{!signedIn && <button className="primary" onClick={() => setAuthOpen(true)}>Sign in to view orders <span>→</span></button>}</div>}</section><RouteFooter />{authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}</main>;
}
