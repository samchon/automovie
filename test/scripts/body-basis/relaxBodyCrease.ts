import { measureAutoMovieMeshCrossings } from "@automovie/engine";

import { meshOfSegment } from "./bodyContactGeometry";

/** Weight of one uniform Laplacian step. */
const LAMBDA = 0.5;

/** Passes before a crease is called unrelaxed. */
const ROUNDS = 60;

/**
 * Unfold a skin segment that has crumpled through itself in a crease.
 *
 * Deep in a bent joint (a fully flexed elbow or knee, an armpit, a roll) the
 * skin has more surface than room, and the blend folds it into a Z that
 * passes through itself. Pushing one sheet off the other only moves the
 * overlap along the crease; what removes it is letting the crumple relax into
 * one smooth fold. The crossing triangles and `rings` rings of their
 * neighbours are relaxed toward the mean of their neighbours (a uniform
 * Laplacian step of weight `LAMBDA`), the outermost ring held so the patch
 * meets the untouched skin, every vertex kept within `budget` metres of where
 * it started, until the segment no longer crosses itself (read every fifth
 * pass) or `ROUNDS` passes.
 *
 * Positions are mutated in place and the displacement from `base` accumulates
 * in `displacement` as the contact solver does, so the caller carries the
 * result to the rest frame the same way. `segment` lists corner indices, three
 * per triangle.
 */
export function relaxBodyCrease(
  positions: number[],
  base: number[],
  displacement: Map<number, number[]>,
  near: number[][],
  segment: number[],
  budget: number,
  rings = 3,
): { solved: boolean; rounds: number; moved: number } {
  const crossedTriangles = (): number[] => {
    const mesh = meshOfSegment(positions, segment);
    return measureAutoMovieMeshCrossings(mesh, mesh).map((c) => c.triangle);
  };
  const crossing = crossedTriangles();
  if (crossing.length === 0) return { solved: true, rounds: 0, moved: 0 };
  // the region: the crossing triangles' corners grown by `rings` rings; the
  // last ring is the held boundary
  let region = new Set<number>();
  for (const t of crossing)
    for (let k = 0; k < 3; k++) region.add(segment[t * 3 + k]);
  let frontier = [...region];
  let boundary = new Set<number>();
  for (let ring = 0; ring < rings; ring++) {
    const added: number[] = [];
    for (const v of frontier)
      for (const u of near[v])
        if (!region.has(u)) {
          region.add(u);
          added.push(u);
        }
    frontier = added;
    if (ring === rings - 1) boundary = new Set(added);
  }
  region = new Set([...region].filter((v) => !boundary.has(v)));
  const free = [...region];
  for (let round = 1; round <= ROUNDS; round++) {
    const next = free.map((v) => {
      const list = near[v];
      const mean = [0, 0, 0];
      for (const u of list)
        for (let k = 0; k < 3; k++) mean[k] += positions[u * 3 + k];
      return [0, 1, 2].map(
        (k) =>
          positions[v * 3 + k] +
          LAMBDA * (mean[k] / list.length - positions[v * 3 + k]),
      );
    });
    free.forEach((v, i) => {
      const d = [0, 1, 2].map((k) => next[i][k] - base[v * 3 + k]);
      const far = Math.hypot(d[0], d[1], d[2]);
      const s = far > budget ? budget / far : 1;
      for (let k = 0; k < 3; k++)
        positions[v * 3 + k] = base[v * 3 + k] + d[k] * s;
      const kept = [0, 1, 2].map((k) => positions[v * 3 + k] - base[v * 3 + k]);
      if (Math.hypot(kept[0], kept[1], kept[2]) > 1e-9)
        displacement.set(v, kept);
      else displacement.delete(v);
    });
    if (
      (round % 5 === 0 || round === ROUNDS) &&
      crossedTriangles().length === 0
    )
      return { solved: true, rounds: round, moved: free.length };
  }
  return { solved: false, rounds: ROUNDS, moved: free.length };
}
