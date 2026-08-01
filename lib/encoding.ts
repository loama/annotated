import type { Annotation } from "./types";

export function encodeAnnotation(annotation: Annotation) {
  if (typeof window === "undefined") return "";
  const bytes = new TextEncoder().encode(JSON.stringify(annotation));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeAnnotation(value: string): Annotation | null {
  if (typeof window === "undefined") return null;
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Annotation;
  } catch {
    return null;
  }
}
