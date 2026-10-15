import type { Rect } from "../Rect";


export function subtract(rect: Rect, cut: Rect): Rect[] {
  const x0 = Math.max(rect[0], cut[0]), x1 = Math.min(rect[1], cut[1]);
  const z0 = Math.max(rect[2], cut[2]), z1 = Math.min(rect[3], cut[3]);
  if (x1 <= x0 || z1 <= z0) return [rect];
  return [
    [rect[0], x0, rect[2], rect[3]],
    [x1, rect[1], rect[2], rect[3]],
    [x0, x1, rect[2], z0],
    [x0, x1, z1, rect[3]],
  ]
    .filter((r) => r[1] - r[0] > 1e-7 && r[3] - r[2] > 1e-7)
    .map((r) => [r[0], r[1], r[2], r[3]]);
}
