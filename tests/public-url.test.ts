import { describe, expect, test } from "bun:test";
import { assertPublicHttpUrl } from "../lib/public-url";

describe("public source URLs", () => {
  test("accepts public HTTPS sources", () => {
    expect(assertPublicHttpUrl("https://example.com/story").hostname).toBe("example.com");
  });

  test("rejects local and private network sources", () => {
    for (const url of ["http://localhost:3000", "http://127.0.0.1", "http://10.0.0.1", "http://172.16.0.1", "http://192.168.1.1", "http://[::1]"]) {
      expect(() => assertPublicHttpUrl(url)).toThrow();
    }
  });
});
