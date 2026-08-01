const PRIVATE_IPV4 = /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/;

export function assertPublicHttpUrl(value: string | URL) {
  const url = value instanceof URL ? value : new URL(value);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only public HTTP sources are supported");
  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    PRIVATE_IPV4.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  ) throw new Error("Private network sources are not supported");
  return url;
}

export async function fetchPublic(value: string | URL, init: RequestInit = {}, maxRedirects = 4) {
  let url = assertPublicHttpUrl(value);
  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const response = await fetch(url, { ...init, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location || redirects === maxRedirects) throw new Error("The source redirected too many times");
    url = assertPublicHttpUrl(new URL(location, url));
  }
  throw new Error("The source could not be reached");
}
