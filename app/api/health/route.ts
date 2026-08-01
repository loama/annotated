import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", product: "annotated", storage: process.env.BLOB_READ_WRITE_TOKEN ? "connected" : "local" });
}
