import { humanSourcePositionTolerance } from "./humanSourcePositionTolerance.ts";

/**
 * Each vertex's left-right twin on a bilaterally symmetric surface: the vertex
 * at its neutral position reflected in x, within the storage tolerance. A
 * vertex without a twin refuses, because the field producers make their
 * results symmetric through this table and cannot invent a twin.
 */
export function mirrorHumanSourceSurface(positions: Float64Array): Int32Array {
  const n = positions.length / 3;
  const cell = 0.001;
  const key = (x: number, y: number, z: number): string =>
    `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  const grid = new Map<string, number[]>();
  for (let v = 0; v < n; v++) {
    const k = key(positions[3 * v], positions[3 * v + 1], positions[3 * v + 2]);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k)!.push(v);
  }
  const twin = new Int32Array(n).fill(-1);
  for (let v = 0; v < n; v++) {
    const x = -positions[3 * v];
    const y = positions[3 * v + 1];
    const z = positions[3 * v + 2];
    let best = -1;
    let gap = Infinity;
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    const cz = Math.floor(z / cell);
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        for (let c = -1; c <= 1; c++)
          for (const w of grid.get(`${cx + a},${cy + b},${cz + c}`) ?? []) {
            const d = Math.hypot(
              positions[3 * w] - x,
              positions[3 * w + 1] - y,
              positions[3 * w + 2] - z,
            );
            if (d < gap) {
              gap = d;
              best = w;
            }
          }
    if (best < 0 || gap > humanSourcePositionTolerance)
      throw new Error(
        `Surface vertex ${v} has no mirror twin within storage (${gap} m).`,
      );
    twin[v] = best;
  }
  return twin;
}
