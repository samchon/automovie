/**
 * Euclidean distance from every vertex to the nearest vertex of a set, metres,
 * searched up to `limitMetres`: a vertex with no member that close reads
 * `limitMetres` (the callers only use distances inside a fade length), and
 * members read zero. A uniform grid of `limitMetres` cells narrows each query
 * to the 27 surrounding cells, which hold every member within the limit, so
 * the answer inside the limit equals a brute-force search.
 */
export function measureHumanSourceDistanceToSet(positions: Float64Array, members: readonly number[], limitMetres: number): Float64Array {
  const n = positions.length / 3;
  const out = new Float64Array(n).fill(limitMetres);
  if (members.length === 0) return out;
  const cell = limitMetres;
  const grid = new Map<string, number[]>();
  const at = (v: number): number[] => [0, 1, 2].map((c) => Math.floor(positions[3 * v + c] / cell));
  for (const m of members) {
    const k = at(m).join(",");
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k)!.push(m);
  }
  for (let v = 0; v < n; v++) {
    const [cx, cy, cz] = at(v);
    let best = limitMetres;
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        for (let c = -1; c <= 1; c++)
          for (const m of grid.get(`${cx + a},${cy + b},${cz + c}`) ?? []) {
            const d = Math.hypot(positions[3 * m] - positions[3 * v], positions[3 * m + 1] - positions[3 * v + 1], positions[3 * m + 2] - positions[3 * v + 2]);
            if (d < best) best = d;
          }
    out[v] = best;
  }
  return out;
}
