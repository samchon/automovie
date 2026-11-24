import type {
  IAutoMovieClosestSegmentPoints,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { closestPointsBetweenSegments } from "../math/closestPointsBetweenSegments";
import { boundAutoMovieProjectionSeparation } from "./boundAutoMovieProjectionSeparation";

/**
 * A conservative separation of the convex hulls of nonempty finite XYZ vertex
 * runs. Points, closed segments, filled triangles and convex cells are
 * measured, including degenerate hulls. Coordinates are represented binary64
 * metres; vectors and arrays remain caller-owned and the scalar result owns no
 * mutable snapshot.
 *
 * For any nonzero stored direction d, every convex combination has a projection
 * between its vertices' extrema. A positive projection gap divided by |d| is
 * therefore a lower bound on Euclidean separation by Cauchy-Schwarz. Each
 * subtraction, product, sum, square root and division is enclosed outward by
 * adjacent binary64 numbers. The direction's norm uses an upper enclosure. No
 * fixed spatial tolerance or approximate closest distance can create PASS.
 * Input coordinates and differences must admit finite enclosing arithmetic;
 * overflow throws instead of returning an unqualified separation, as do an
 * empty run, a non-finite coordinate and a negative or NaN `sufficient`.
 *
 * Candidate directions are every vertex-triple normal, `b`'s first, then the
 * displacement between the two first vertices, then the closest-point
 * displacement of every vertex pair of `a` against every vertex pair of `b`,
 * taken from the shared segment kernel. Approximate witnesses only choose
 * directions: even a poor direction retains the projection proof. Zero means
 * touching, intersecting, or unresolved; it does not assert an intersection.
 * This is neither signed side classification nor a complete contact-manifold
 * query. In particular a triangle containing an allowed attachment point still
 * receives zero when another part crosses.
 *
 * `sufficient` stops once a direction already proves that nonnegative requested
 * separation. The returned bound can then be weaker than another direction's;
 * omitted or infinite `sufficient` examines all directions. This cost control
 * changes no admission: callers accept only a bound at least their requested
 * separation. `spend` is an optional caller-owned work counter, invoked before
 * each normal triple, each projection axis and each pair calculation; the
 * resident mesh separation query always supplies its budget and passes its
 * resident triangle as `b`.
 */
export function boundAutoMovieConvexSeparation(
  a: readonly IAutoMovieVector3[],
  b: readonly IAutoMovieVector3[],
  sufficient: number = Infinity,
  spend?: () => void,
): number {
  if (a.length < 1 || b.length < 1 || !(sufficient >= 0))
    throw new Error(
      "Convex separation requires nonempty finite vertex runs and a nonnegative target.",
    );
  let best: number = 0;
  const offer = (raw: IAutoMovieVector3): boolean => {
    spend?.();
    best = Math.max(best, boundAutoMovieProjectionSeparation(a, b, raw));
    return best >= sufficient;
  };
  // Cross products only propose stored directions; their rounding is never a
  // bound on geometry. Scaling their operands prevents gratuitous overflow.
  // Resident queries pass their triangle as b; its one face normal is the
  // inexpensive direction most likely to prove a nearby exterior patch.
  for (const vertices of [b, a])
    for (let i: number = 0; i < vertices.length - 2; i++)
      for (let j: number = i + 1; j < vertices.length - 1; j++)
        for (let k: number = j + 1; k < vertices.length; k++) {
          spend?.();
          const u: IAutoMovieVector3 = Vector3.subtract(
            vertices[j]!,
            vertices[i]!,
          );
          const v: IAutoMovieVector3 = Vector3.subtract(
            vertices[k]!,
            vertices[i]!,
          );
          const scale: number = Math.max(
            Math.abs(u.x),
            Math.abs(u.y),
            Math.abs(u.z),
            Math.abs(v.x),
            Math.abs(v.y),
            Math.abs(v.z),
          );
          if (
            scale > 0 &&
            offer(Vector3.cross(divideVector(u, scale), divideVector(v, scale)))
          )
            return best;
        }
  if (offer(Vector3.subtract(a[0]!, b[0]!))) return best;
  const aPairs: [number, number][] = vertexPairs(a.length);
  const bPairs: [number, number][] = vertexPairs(b.length);
  for (const [p, q] of aPairs)
    for (const [r, s] of bPairs) {
      spend?.();
      const hit: IAutoMovieClosestSegmentPoints = closestPointsBetweenSegments(
        a[p]!,
        a[q]!,
        b[r]!,
        b[s]!,
      );
      if (offer(Vector3.subtract(hit.pointA, hit.pointB))) return best;
    }
  return best;
}

/** A vector divided componentwise by a positive scalar. */
const divideVector = (
  vector: IAutoMovieVector3,
  scale: number,
): IAutoMovieVector3 => ({
  x: vector.x / scale,
  y: vector.y / scale,
  z: vector.z / scale,
});

/**
 * Every vertex pair `(i, j)` with `i < j` of a run of `count` vertices, in
 * nested-loop order; a one-vertex run is its own zero-length pair `(0, 0)`.
 */
const vertexPairs = (count: number): [number, number][] => {
  if (count === 1) return [[0, 0]];
  const pairs: [number, number][] = [];
  for (let i: number = 0; i < count - 1; i++)
    for (let j: number = i + 1; j < count; j++) pairs.push([i, j]);
  return pairs;
};
