import type { AutoMovieVector3Tuple } from "@automovie/interface";

import { AutoMovieCurveMath64 as M } from "../AutoMovieCurveMath64";
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
const cross: (a: V3, b: V3) => V3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/**
 * Accumulate emitted contour-face area vectors and normalize each vertex once.
 * Positions remain in the original common millimetre chart. Opposing areas can
 * cancel; a zero accumulated vector stays zero without a substitute normal.
 */
export function computeAutoMovieContourNormals64(
  vertices: readonly Readonly<AutoMovieVector3Tuple>[],
  triangles: readonly (readonly [number, number, number])[],
): number[] {
  const geometricNormals: V3[] = vertices.map((): V3 => [0, 0, 0]);
  for (const t of triangles) {
    const n: V3 = cross(
      sub(vertices[t[1]], vertices[t[0]]),
      sub(vertices[t[2]], vertices[t[0]]),
    );
    for (const i of t) geometricNormals[i] = add(geometricNormals[i], n);
  }
  return geometricNormals.flatMap((normal: V3): V3 => {
    const length: number = Math.hypot(...normal);
    return length > 0 ? mul(normal, 1 / length) : [0, 0, 0];
  });
}

type V3 = AutoMovieVector3Tuple;
