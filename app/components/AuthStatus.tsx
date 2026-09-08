"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthStatus({ onSignIn }: { onSignIn?: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!supabase) return;

    const applyUser = (user: { email?: string; user_metadata?: { full_name?: string; display_name?: string } } | null) => {
      setEmail(user?.email || null);
      setName(user?.user_metadata?.full_name || user?.user_metadata?.display_name || "");
    };

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!email) return <button className="sign-in-link" onClick={onSignIn}>Sign in</button>;

  return <div className="auth-status"><span className="auth-avatar">{(name || email).slice(0, 1).toUpperCase()}</span><span className="auth-identity"><strong>{name || "Signed in"}</strong><small>{email}</small></span><button onClick={() => supabase?.auth.signOut()}>Sign out</button></div>;
}
