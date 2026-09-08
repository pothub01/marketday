import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, reason: "missing-environment" }, { status: 503 });
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      cache: "no-store",
    });
    return NextResponse.json({ ok: response.ok, status: response.status, host: new URL(url).host }, { status: response.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ ok: false, reason: "unreachable", host: new URL(url).host }, { status: 502 });
  }
}
