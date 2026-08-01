import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import type { Claim } from "@/lib/types";

export async function POST(request: NextRequest) {
  let input: Omit<Claim, "id" | "createdAt">;
  try { input = await request.json() as Omit<Claim, "id" | "createdAt">; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!input.annotationId || !input.email?.includes("@") || input.details?.trim().length < 12 || !["copyright", "context", "privacy", "other"].includes(input.reason)) {
    return NextResponse.json({ error: "Claim is incomplete" }, { status: 422 });
  }
  const claim: Claim = { ...input, id: `claim-${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    await put(`claims/${input.annotationId}/${claim.id}.json`, JSON.stringify(claim), { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json", token: blobToken });
  }
  return NextResponse.json({ id: claim.id, received: true }, { status: 201 });
}
