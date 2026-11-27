import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The orthonormal frame a directional procedural surface reads its axis in:
 * `along` is the unit axis, `across` is `normalize(along × Z)`, or
 * `normalize(along × X)` when `along × Z` is shorter than 1e-6, and `normal` is
 * `along × across`.
 *
 * Wood measures ring distance across `along`, fabric runs its warp along
 * `along` and its weft along `across`, and brushed metal stretches its noise
 * along `along`. Taking `across` from the sampling space's Z keeps a cloth in
 * its object XY plane, and every pattern piece, whose sheet space has its
 * normal along Z, weaving in its own plane. The renderer receives the three
 * vectors as uniforms, so both evaluations read one frame.
 * Parameter axis: Finite nonzero direction, as admitted.
 * Returns: Three unit vectors as `[x, y, z]` tuples.
 */
export function proceduralFrameImplementation(axis: IAutoMovieVector3): {
  along: [number, number, number];
  across: [number, number, number];
  normal: [number, number, number];
} {
  const along: [number, number, number] = unit([axis.x, axis.y, axis.z]);
  let across: [number, number, number] = cross(along, [0, 0, 1]);
  if (Math.hypot(...across) < 1e-6) across = cross(along, [1, 0, 0]);
  across = unit(across);
  return { along, across, normal: cross(along, across) };
}

/*
 * The vector scaled to unit length.
 */
function unit(v: [number, number, number]): [number, number, number] {
  const length: number = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
}

/*
 * The cross product `a × b`.
 */
function cross(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
