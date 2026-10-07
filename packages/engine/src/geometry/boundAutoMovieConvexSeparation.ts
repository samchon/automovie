import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { closestPointsBetweenSegments } from "../math/closestPointsBetweenSegments";
import { boundAutoMovieProjectionSeparation } from "./boundAutoMovieProjectionSeparation";

/**
 * A conservative separation of the convex hulls of nonempty finite XYZ vertex runs.
 * Points, closed segments, filled triangles and convex cells are measured,
 * including degenerate hulls. Coordinates are represented binary64 metres; vectors and arrays
 * remain caller-owned and the scalar result owns no mutable snapshot.
 *
 * For any nonzero stored direction d, every convex combination has a projection
 * between its vertices' extrema. A positive projection gap divided by |d| is
 * therefore a lower bound on Euclidean separation by Cauchy-Schwarz. Each
 * subtraction, product, sum, square root and division is enclosed outward by
 * adjacent binary64 numbers. The direction's norm uses an upper enclosure.
 * No fixed spatial tolerance or approximate closest distance can create PASS.
 * Input coordinates and differences must admit finite enclosing arithmetic;
 * overflow refuses instead of returning an unqualified separation.
 *
 * Candidate directions are all vertex-triple normals, the origin displacement, and
 * closest edge-pair witness displacements from the shared segment kernel.
 * Approximate witnesses only choose directions: even a poor direction retains
 * the projection proof. Zero means touching, intersecting, or unresolved; it
 * does not assert an intersection. This is neither signed side classification
 * nor a complete contact-manifold query. In particular a triangle containing
 * an allowed attachment point still receives zero when another part crosses.
 *
 * `sufficient` stops once a direction already proves that nonnegative requested
 * separation. The returned bound can then be weaker than another direction's;
 * omitted/infinite sufficient examines all directions. This cost control changes
 * no admission: callers accept only lowerBound >= their requested separation.
 * `spend` is an optional caller-owned work counter, invoked before each axis
 * normal triple, projection axis and edge-pair calculation; the resident mesh query always supplies its budget.
 * Triple and pair enumeration costs grow with the convex input vertex count.
 * The resident mesh separation query consumes this owner for whole features.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Bounds separation of complete resident convex features without replacing their interiors by sampled corners.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves point, segment and triangle coordinates and qualifies their separation through outward-enclosed support projections.
 * @author Samchon
 */
export function boundAutoMovieConvexSeparation(
  a: readonly IAutoMovieVector3[],
  b: readonly IAutoMovieVector3[],
  sufficient: number = Infinity,
  spend?: () => void,
): number {
  if (
    a.length < 1 ||
    b.length < 1 ||
    ![...a, ...b].every(
      (p) =>
        p !== undefined && p !== null && [p.x, p.y, p.z].every(Number.isFinite),
    ) ||
    !(sufficient >= 0)
  )
    throw new Error(
      "Convex separation requires nonempty finite vertex runs and a nonnegative target.",
    );
  let best = 0;
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
    for (let i = 0; i < vertices.length - 2; i++)
      for (let j = i + 1; j < vertices.length - 1; j++)
        for (let k = j + 1; k < vertices.length; k++) {
          spend?.();
          const u = Vector3.subtract(vertices[j], vertices[i]);
          const v = Vector3.subtract(vertices[k], vertices[i]);
          const scale = Math.max(
            ...[u, v].flatMap((p) => [
              Math.abs(p.x),
              Math.abs(p.y),
              Math.abs(p.z),
            ]),
          );
          if (!Number.isFinite(scale))
            throw new Error(
              "Convex separation requires finite face differences.",
            );
          const scaled = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
            x: p.x / scale,
            y: p.y / scale,
            z: p.z / scale,
          });
          if (scale > 0 && offer(Vector3.cross(scaled(u), scaled(v))))
            return best;
        }
  if (offer(Vector3.subtract(a[0], b[0]))) return best;
  const edges = (
    vertices: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3[][] => {
    const result: IAutoMovieVector3[][] = [];
    if (vertices.length === 1) return [[vertices[0], vertices[0]]];
    for (let i = 0; i < vertices.length - 1; i++)
      for (let j = i + 1; j < vertices.length; j++)
        result.push([vertices[i], vertices[j]]);
    return result;
  };
  for (const first of edges(a))
    for (const second of edges(b)) {
      spend?.();
      const hit = closestPointsBetweenSegments(
        first[0],
        first[1],
        second[0],
        second[1],
      );
      if (offer(Vector3.subtract(hit.pointA, hit.pointB))) return best;
    }
  return best;
}
