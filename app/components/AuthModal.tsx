"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

type AuthMode = "signin" | "signup";

export default function AuthModal({ initialMode = "signin", onClose }: { initialMode?: AuthMode; onClose: () => void }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("Authentication is not configured yet. Add the Supabase public URL and anon key in Vercel.");
      return;
    }
    setBusy(true);
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message === "Failed to fetch"
        ? "Unable to connect to Supabase. Check your Vercel Supabase URL, anon key, and project status."
        : result.error.message);
      return;
    }
    setMessage(mode === "signin" ? "Signed in successfully." : "Account created. Check your email to confirm your address.");
    if (mode === "signin") window.setTimeout(onClose, 700);
  }

  async function signInWithGoogle() {
    setMessage("");
    if (!supabase) {
      setMessage("Authentication is not configured yet. Add the Supabase public URL and anon key in Vercel.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
    if (error) setMessage(error.message === "Failed to fetch"
      ? "Unable to connect to Supabase. Check your Vercel Supabase URL, anon key, and project status."
      : error.message);
  }

  return <div className="auth-overlay" onClick={onClose}><section className="auth-modal" onClick={(event) => event.stopPropagation()} aria-labelledby="auth-title"><button className="auth-close" onClick={onClose} aria-label="Close authentication dialog">×</button><span className="kicker">{mode === "signin" ? "Welcome back" : "Join the market"}</span><h2 id="auth-title">{mode === "signin" ? "Sign in to Marketday." : "Create your account."}</h2><p className="auth-intro">{mode === "signin" ? "Save your details and keep track of every delivery." : "Make your market runs simpler, faster, and more personal."}</p><button className="google-button" onClick={signInWithGoogle}><span className="google-g">G</span> Continue with Google</button><div className="auth-divider"><span>or use email</span></div><form onSubmit={submit}>{mode === "signup" && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required /></label>}<label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>{message && <p className={`auth-message ${message.includes("successfully") || message.includes("created") ? "success" : ""}`}>{message}</p>}<button className="primary auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"} <span>→</span></button></form><p className="auth-switch">{mode === "signin" ? "New to Marketday?" : "Already have an account?"} <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p></section></div>;
}
