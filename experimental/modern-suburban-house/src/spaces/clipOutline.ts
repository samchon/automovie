

import type { IWallPoint } from "../types/IWallPoint";

/** Clip a face outline to a (u, y) rectangle, one rectangle side at a time. */
export const clipOutline = (outline: readonly IWallPoint[], u: readonly [number, number], y: readonly [number, number]): IWallPoint[] => {
  const sides: ((p: IWallPoint) => number)[] = [
    (p) => p.u - u[0],
    (p) => u[1] - p.u,
    (p) => p.y - y[0],
    (p) => y[1] - p.y,
  ];
  let poly: IWallPoint[] = [...outline];
  for (const d of sides) {
    const next: IWallPoint[] = [];
    for (let i = 0; i < poly.length; ++i) {
      const a = poly[i]!;
      const b = poly[(i + 1) % poly.length]!;
      const da = d(a);
      const db = d(b);
      if (da >= 0) next.push(a);
      if (da >= 0 !== db >= 0) {
        const s = da / (da - db);
        next.push({ u: a.u + s * (b.u - a.u), y: a.y + s * (b.y - a.y) });
      }
    }
    poly = next.filter((q, i, all) => {
      const prev = all[(i + all.length - 1) % all.length]!;
      return Math.abs(q.u - prev.u) > 1e-9 || Math.abs(q.y - prev.y) > 1e-9;
    });
  }
  return poly;
};

