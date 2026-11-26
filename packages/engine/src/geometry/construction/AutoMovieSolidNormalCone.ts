import type { AutoMovieVector3Tuple as P3 } from "@automovie/interface";

import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/**
 * A positive physical projection for a finite set of authored tangent planes.
 * Its margin is measured against every supplied unit normal.
 *
 * @see https://doi.org/10.1109/56.2083 Gilbert, Johnson and Keerthi's support simplex.
 */
export namespace AutoMovieSolidNormalCone {
  /** A supplied normal and the original authoring address behind it. */
  export interface INormal {
    /** The normal's source identity in the supplied finite scope. */
    readonly id: number;

    /** A unit oriented surface normal. */
    readonly vector: P3;
  }

  /** Gilbert–Johnson–Keerthi support steps on the sampled normal hull. */
  export function maximumMargin(rows: readonly INormal[]) {
    let hull = closest([rows[0]!]);
    for (let iteration = 0; iteration < rows.length; ++iteration) {
      const y = hull.point;
      const site = rows.reduce((a, b) =>
        Vec.dot(y, b.vector) < Vec.dot(y, a.vector) ? b : a,
      );
      const bound = Vec.norm(y);
      const minimum = Vec.dot(site.vector, y);
      // The returned margin is evaluated on every supplied normal. The
      // current convex combination is an upper bound even at roundoff.
      if (
        bound === 0 ||
        bound * bound - minimum <= 16 * Number.EPSILON ||
        hull.active.includes(site)
      )
        break;
      const next = closest([...hull.active, site]);
      if (!(Vec.norm(next.point) < bound)) break;
      hull = next;
    }
    const direction = Vec.unit(hull.point);
    const margin =
      direction === null
        ? null
        : Math.min(...rows.map(({ vector }) => Vec.dot(direction, vector)));
    return {
      normal: margin !== null && margin > 0 ? direction : null,
      margin,
      bound: Vec.norm(hull.point),
      witness: hull.active.map(({ id }, i) => ({
        id,
        weight: hull.weights[i]!,
      })),
    };
  }

  /** Evaluate every face of the at-most-tetrahedral support simplex. */
  function closest(simplex: readonly INormal[]) {
    const first = simplex[0]!;
    let best = { active: [first], point: first.vector, weights: [1] };
    for (let bits = 1; bits < 2 ** simplex.length; ++bits) {
      const active = simplex.filter((_, i) => (bits & (1 << i)) !== 0);
      const origin = active[0]!.vector;
      const spans = active
        .slice(1)
        .map(({ vector }) => Vec.sub(vector, origin));
      const gram = spans.map((a) => spans.map((b) => Vec.dot(a, b)));
      const suffix =
        spans.length === 0
          ? []
          : Vec.solve(
              gram,
              spans.map((a) => -Vec.dot(a, origin)),
            );
      if (suffix === null) continue;
      const weights = [1 - suffix.reduce((a, b) => a + b, 0), ...suffix];
      if (weights.some((w) => w <= 0)) continue;
      const point = Vec.combine(
        active.map(({ vector }, i) => [weights[i]!, vector]),
      );
      if (Vec.norm(point) < Vec.norm(best.point))
        best = { active, point, weights };
    }
    return best;
  }
}
