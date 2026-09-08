import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "marketday-web",
    timestamp: new Date().toISOString(),
  });
}
