import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const latitude = request.nextUrl.searchParams.get("lat");
  const longitude = request.nextUrl.searchParams.get("lon");

  if ((!query && (!latitude || !longitude)) || (query && (latitude || longitude))) {
    return NextResponse.json({ error: "Provide either q or lat/lon." }, { status: 400 });
  }

  const url = query
    ? `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
    : `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude || "")}&lon=${encodeURIComponent(longitude || "")}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Marketday/1.0 delivery location picker" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Geocoding service unavailable." }, { status: 502 });
  }

  return NextResponse.json(await response.json());
}
