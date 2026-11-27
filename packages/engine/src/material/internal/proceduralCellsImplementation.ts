import { proceduralHashImplementation } from "./proceduralHashImplementation";

/*
 * The cellular distances of procedural stone, in lattice units: the distances
 * `f1` and `f2` from the point to the nearest and second-nearest feature points
 * (Worley 1996, "A cellular texture basis function", SIGGRAPH).
 *
 * Every lattice cube holds exactly one feature point, at the cube's corner plus
 * the three words of `proceduralHashImplementation(seed, 16, cube)` divided by 2³².
 * The search covers the point's own cube and its 26 neighbours, as Worley's own
 * neighbourhood search does. Every point outside that block lies at least one
 * cube side away, so both distances are exact whenever they are at most one
 * side; a larger distance can miss a nearer point two cubes away, which the
 * renderer misses identically.
 * Parameter seed: Unsigned 32-bit seed.
 * Returns: `[f1, f2]` at the lattice-unit point `(x, y, z)`.
 */
export function proceduralCellsImplementation(
  seed: number,
  x: number,
  y: number,
  z: number,
): [number, number] {
  const i: number = Math.floor(x);
  const j: number = Math.floor(y);
  const k: number = Math.floor(z);
  let f1: number = Infinity;
  let f2: number = Infinity;
  for (let di: number = -1; di <= 1; ++di)
    for (let dj: number = -1; dj <= 1; ++dj)
      for (let dk: number = -1; dk <= 1; ++dk) {
        const h: [number, number, number] = proceduralHashImplementation(
          seed,
          16,
          i + di,
          j + dj,
          k + dk,
        );
        const d: number = Math.hypot(
          i + di + h[0] / 4294967296 - x,
          j + dj + h[1] / 4294967296 - y,
          k + dk + h[2] / 4294967296 - z,
        );
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) f2 = d;
      }
  return [f1, f2];
}
