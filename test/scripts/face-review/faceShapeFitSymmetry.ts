/**
 * Mirror asymmetry of a basis endpoint's displacement field.
 *
 * `fit-face-landmarks.ts` holds symmetry-breaking channels harder than the
 * others, because a healthy face's directional asymmetry is a few
 * millimetres at most while a channel that slides the mouth or the nose
 * sideways can take a whole landmark residual of head pose or detector bias
 * and turn it into a lopsided face. Which channels break symmetry is read
 * from the data, not from their names.
 *
 * `faceShapeFitMirror` pairs every vertex with the vertex nearest its mirror
 * image `(-x, y, z)` in the neutral positions: the neighbouring cells of a
 * uniform grid hold any partner within one cell, which is exact, and a
 * farther partner is found by a full scan. `faceShapeFitAsymmetry` then compares an endpoint's
 * displacement `d` with its mirrored copy `M d` (the displacement at a
 * vertex's mirror partner, its x negated): the index is
 * `|d - M d| / |d|` over the whole surface, 0 for a mirror-symmetric field,
 * 2 for a pure lateral slide, sqrt(2) for a field on one side only. An endpoint
 * with no displacement has index 0. Pure: inputs are read, new arrays are
 * returned.
 */

/** Index of each vertex's mirror partner in the same positions. */
export function faceShapeFitMirror(positions: readonly number[]): number[] {
  const count = positions.length / 3;
  if (count === 0) return [];
  let extent = 0;
  for (const value of positions) extent = Math.max(extent, Math.abs(value));
  const cell = Math.max(extent / 64, 1e-12);
  const key = (x: number, y: number, z: number) =>
    `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  const grid = new Map<string, number[]>();
  for (let v = 0; v < count; ++v) {
    const k = key(
      positions[3 * v]!,
      positions[3 * v + 1]!,
      positions[3 * v + 2]!,
    );
    const bucket = grid.get(k);
    if (bucket === undefined) grid.set(k, [v]);
    else bucket.push(v);
  }
  return Array.from({ length: count }, (_, v) => {
    const x = -positions[3 * v]!;
    const y = positions[3 * v + 1]!;
    const z = positions[3 * v + 2]!;
    let best = v;
    let distance = Infinity;
    // Search the neighbouring grid shells first. On a mirror-symmetric
    // neutral the partner lies at a rounding distance inside them; a vertex
    // whose mirror image is farther away falls back to an exact scan.
    const [cx, cy, cz] = [x, y, z].map((value) => Math.floor(value / cell));
    for (let i = cx! - 1; i <= cx! + 1; ++i)
      for (let j = cy! - 1; j <= cy! + 1; ++j)
        for (let k = cz! - 1; k <= cz! + 1; ++k)
          for (const u of grid.get(`${i},${j},${k}`) ?? []) {
            const d = Math.hypot(
              positions[3 * u]! - x,
              positions[3 * u + 1]! - y,
              positions[3 * u + 2]! - z,
            );
            if (d < distance) [distance, best] = [d, u];
          }
    if (distance > cell)
      for (let u = 0; u < count; ++u) {
        const d = Math.hypot(
          positions[3 * u]! - x,
          positions[3 * u + 1]! - y,
          positions[3 * u + 2]! - z,
        );
        if (d < distance) [distance, best] = [d, u];
      }
    return best;
  });
}

/** Mirror asymmetry index of one endpoint's sparse `[vertex, dx, dy, dz]` rows. */
export function faceShapeFitAsymmetry(
  rows: readonly number[],
  mirror: readonly number[],
): number {
  const field = new Map<number, [number, number, number]>();
  for (let i = 0; i < rows.length; i += 4)
    field.set(rows[i]!, [rows[i + 1]!, rows[i + 2]!, rows[i + 3]!]);
  let difference = 0;
  let norm = 0;
  const vertices = new Set([
    ...field.keys(),
    ...[...field.keys()].map((v) => mirror[v]!),
  ]);
  for (const v of vertices) {
    const d = field.get(v) ?? [0, 0, 0];
    const m = field.get(mirror[v]!) ?? [0, 0, 0];
    difference += (d[0] + m[0]) ** 2 + (d[1] - m[1]) ** 2 + (d[2] - m[2]) ** 2;
    norm += d[0] ** 2 + d[1] ** 2 + d[2] ** 2;
  }
  return norm === 0 ? 0 : Math.sqrt(difference / norm);
}
