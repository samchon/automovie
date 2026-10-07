import {
  adjacentAutoMovieFloat64,
  closestPointsBetweenSegments,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanSourceCrownSolid } from "./structures/IHumanSourceCrownSolid.ts";

/**
 * Minimum full-surface distance of two source crowns already known not to cross.
 *
 * Triangle distance extrema lie at vertex-to-triangle or edge-to-edge closest
 * features. Unique native edge incidence belongs to the immutable source
 * topology; only its candidate endpoint coordinates are read here. Both
 * vertex directions use the signed-query owner's unsigned
 * distance; every unique edge pair uses the engine's bounded segment owner.
 * No convex hull replaces the source triangles or their cervical closures.
 *
 * Edge boxes prune only against a conservative upper distance between actual
 * source vertices. Outward binary64 neighbours enclose that witness and the
 * box-distance arithmetic, so pruning introduces no spatial tolerance. The
 * returned feature measurement retains the engine kernels' binary64 precision
 * limits and is not an independently calibrated clinical measurement.
 */
export function measureHumanSourceCrownGap(
  a: IHumanSourceCrownSolid,
  b: IHumanSourceCrownSolid,
): number {
  const point = (
    solid: IHumanSourceCrownSolid,
    vertex: number,
  ): IAutoMovieVector3 => ({
    x: solid.mesh.positions[3 * vertex],
    y: solid.mesh.positions[3 * vertex + 1],
    z: solid.mesh.positions[3 * vertex + 2],
  });
  const p = a.vertices.map((vertex) => point(a, vertex)),
    q = b.vertices.map((vertex) => point(b, vertex));
  let least = Infinity,
    upperSquared = Infinity;
  const up = (value: number): number => adjacentAutoMovieFloat64(value, true);
  const down = (value: number): number =>
    adjacentAutoMovieFloat64(value, false);
  for (const x of p) {
    least = Math.min(least, b.query([x.x, x.y, x.z]).distance);
    for (const y of q) {
      let upper = 0;
      for (const axis of ["x", "y", "z"] as const) {
        const delta = x[axis] - y[axis];
        const magnitude = up(
          Math.max(Math.abs(down(delta)), Math.abs(up(delta))),
        );
        upper = up(upper + up(magnitude * magnitude));
      }
      upperSquared = Math.min(upperSquared, upper);
    }
  }
  for (const x of q) least = Math.min(least, a.query([x.x, x.y, x.z]).distance);
  for (const [i, j] of a.edges) {
    const x = point(a, i),
      y = point(a, j);
    for (const [k, l] of b.edges) {
      const z = point(b, k),
        w = point(b, l);
      let lower = 0;
      for (const axis of ["x", "y", "z"] as const) {
        const gap = Math.max(
          0,
          down(Math.min(x[axis], y[axis]) - Math.max(z[axis], w[axis])),
          down(Math.min(z[axis], w[axis]) - Math.max(x[axis], y[axis])),
        );
        lower = Math.max(0, down(lower + Math.max(0, down(gap * gap))));
      }
      if (lower > upperSquared) continue;
      least = Math.min(
        least,
        closestPointsBetweenSegments(x, y, z, w).distance,
      );
    }
  }
  if (!Number.isFinite(least) || least < 0)
    throw new Error(
      "Source crown gap has no finite nonnegative feature distance.",
    );
  return least;
}
