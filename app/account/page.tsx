 "use client";

import { useState } from "react";
import { useEffect } from "react";
import RouteHeader, { RouteFooter } from "../components/RouteHeader";
import Link from "next/link";
import AuthModal from "../components/AuthModal";
import { supabase } from "../../lib/supabase";

export default function AccountPage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string; display_name?: string } } | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const name = user?.user_metadata?.full_name || user?.user_metadata?.display_name || "Marketday shopper";
  return <main className="app"><RouteHeader active="account" /><section className="simple-page account-page"><div className="page-title"><span className="kicker">Your marketday account</span><h1>{loading ? "Loading your account." : user ? `Hi, ${name}.` : "Shop with us."}</h1><p>{user ? "Your account details, addresses, and orders are all in one place." : "Sign in to save your details, track orders, and check out faster."}</p></div>{user ? <div className="account-grid"><div className="account-card profile"><div className="large-avatar">{name.slice(0, 2).toUpperCase()}</div><h2>{name}</h2><p>{user.email}</p><button className="outline" onClick={() => supabase?.auth.signOut()}>Sign out</button></div><div className="account-card"><span className="account-icon">⌖</span><h3>Delivery addresses</h3><p>Add a saved address for faster checkout.</p><button className="text-button">Manage addresses →</button></div><div className="account-card"><span className="account-icon">▣</span><h3>Payment methods</h3><p>Payment details are managed securely at checkout.</p><Link className="text-button" href="/checkout">Go to checkout →</Link></div></div> : <div className="guest-card"><div className="guest-icon">♙</div><h2>Welcome to Marketday</h2><p>You&apos;re currently browsing as a guest. Sign in or create an account to access your orders, saved addresses, and payment methods.</p><div className="guest-actions"><button className="primary" onClick={() => setAuthMode("signin")}>Sign in <span>→</span></button><button className="outline" onClick={() => setAuthMode("signup")}>Create account</button></div></div>}<div className="account-banner"><div><span className="kicker">Need a hand?</span><h2>Our market people are here for you.</h2><p>Questions about an order, delivery, or an ingredient?</p></div><Link className="primary" href="/">Continue shopping →</Link></div></section><RouteFooter />{authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />}</main>;
}
