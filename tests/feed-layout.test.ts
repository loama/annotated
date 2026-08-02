import { describe, expect, test } from "bun:test";
import { buildFeedLayout } from "../lib/feed-layout";

describe("feed layout", () => {
  test("packs complete rows without visual holes", () => {
    for (let count = 2; count <= 30; count += 1) {
      const layout = buildFeedLayout(count);
      const rows = new Map<number, typeof layout>();
      layout.forEach((item) => rows.set(item.row, [...(rows.get(item.row) || []), item]));

      expect(layout).toHaveLength(count);
      for (const items of rows.values()) {
        const span = items.reduce((total, item) => total + item.span, 0);
        expect(span).toBe(12);
      }
    }
  });

  test("centers a single remaining card", () => {
    expect(buildFeedLayout(1)).toEqual([
      { centered: true, density: "wide", row: 0, span: 8 },
    ]);
  });

  test("uses a changing but bounded set of card sizes", () => {
    const layout = buildFeedLayout(10);
    expect(new Set(layout.map((item) => item.span))).toEqual(new Set([4, 5, 6, 7]));
    expect(new Set(layout.map((item) => item.density))).toEqual(new Set(["compact", "standard", "wide"]));
  });
});
