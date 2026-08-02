export type FeedCardDensity = "compact" | "standard" | "wide";

export type FeedCardLayout = {
  centered: boolean;
  density: FeedCardDensity;
  row: number;
  span: 4 | 5 | 6 | 7 | 8;
};

const tailRows: Record<number, number[]> = {
  0: [],
  1: [1],
  2: [2],
  3: [3],
  4: [2, 2],
  5: [2, 3],
  6: [3, 3],
};

const pairedWidths: Array<[5 | 6 | 7, 5 | 6 | 7]> = [
  [7, 5],
  [6, 6],
  [5, 7],
];

export function buildFeedLayout(count: number): FeedCardLayout[] {
  const safeCount = Math.max(0, Math.floor(count));
  const rowSizes: number[] = [];
  let remaining = safeCount;

  while (remaining > 6) {
    rowSizes.push(2, 3);
    remaining -= 5;
  }
  rowSizes.push(...tailRows[remaining]);

  const layout: FeedCardLayout[] = [];
  let pairIndex = 0;

  rowSizes.forEach((rowSize, row) => {
    const spans: Array<4 | 5 | 6 | 7 | 8> = rowSize === 1
      ? [8]
      : rowSize === 2
        ? pairedWidths[pairIndex++ % pairedWidths.length]
        : [4, 4, 4];

    spans.forEach((span) => {
      layout.push({
        centered: rowSize === 1,
        density: span <= 4 ? "compact" : span >= 7 ? "wide" : "standard",
        row,
        span,
      });
    });
  });

  return layout;
}
