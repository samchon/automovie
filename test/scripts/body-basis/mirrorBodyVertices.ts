import { MIRROR_TOLERANCE } from "./MIRROR_TOLERANCE";

/**
 * For each vertex, the vertex at its mirrored position, or `-1` when none lies
 * within `tolerance`. A grid of tolerance-sized cells finds the partner in the
 * 27 cells around the mirrored position; among several the nearest wins, ties
 * to the lower index.
 */
export function mirrorBodyVertices(
  positions: number[],
  tolerance = MIRROR_TOLERANCE,
): number[] {
  if (
    !Number.isFinite(tolerance) ||
    !(tolerance > 0) ||
    positions.length % 3 !== 0 ||
    positions.some((value) => !Number.isFinite(value))
  )
    throw new Error(
      "Body mirror association requires finite triples and a positive tolerance.",
    );
  const count = positions.length / 3;
  const cell = (value: number): number => Math.floor(value / tolerance);
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
  for (let v = 0; v < count; v++) {
    const at = key(
      cell(positions[v * 3]),
      cell(positions[v * 3 + 1]),
      cell(positions[v * 3 + 2]),
    );
    const list = grid.get(at);
    if (list === undefined) grid.set(at, [v]);
    else list.push(v);
  }
  const partner: number[] = new Array<number>(count).fill(-1);
  for (let v = 0; v < count; v++) {
    const target = [
      -positions[v * 3],
      positions[v * 3 + 1],
      positions[v * 3 + 2],
    ];
    const middle = target.map(cell);
    let best = -1;
    let nearest = tolerance * tolerance;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++)
          for (const u of grid.get(
            key(middle[0] + dx, middle[1] + dy, middle[2] + dz),
          ) ?? []) {
            const apart =
              (positions[u * 3] - target[0]) ** 2 +
              (positions[u * 3 + 1] - target[1]) ** 2 +
              (positions[u * 3 + 2] - target[2]) ** 2;
            if (
              apart < nearest ||
              (apart === nearest && (best < 0 || u < best))
            ) {
              nearest = apart;
              best = u;
            }
          }
    partner[v] = best;
  }
  return partner;
}
