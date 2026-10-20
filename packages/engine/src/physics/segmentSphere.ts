import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

const VECTOR_AXES: readonly ["x", "y", "z"] = ["x", "y", "z"] as const;

const assertFiniteVector: (name: string, vector: IAutoMovieVector3) => void = (
  name: string,
  vector: IAutoMovieVector3,
): void => {
  for (const axis of VECTOR_AXES)
    if (!Number.isFinite(vector[axis]))
      throw new RangeError(
        `segment sphere ${name}.${axis} must be finite, but was ${vector[axis]}`,
      );
};

/**
 * First intersection of the segment `a→b` with a sphere, as the parameter `s ∈
 * [0, 1]` where contact begins (`a + s·(b−a)`), or `null` if the segment never
 * touches the sphere. If `a` already lies inside, returns `0`.
 *
 * Solves `|a + s·d − c|² = r²` (a quadratic in `s`) and returns the entry root
 * that falls within the segment. A degenerate segment (`a == b`) reduces to a
 * point-in-sphere test.
 *
 *
 * @evidence contracts/common.md#principled-implementation Solve the segment-sphere quadratic and select its first entry in [0,1], including tangency and zero for starts inside. A zero-length segment hits only when inside; extreme finite coordinates can overflow or lose root precision.
 * @evidence contracts/common.md#clear-and-simple-design This scalar parameter predicate owns analytic chord geometry and leaves trajectory time conversion to projectileSphereHit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ordinary discriminant/root formula is used for every collider; no fixture tolerance or fabricated intersection compensates for numeric limits.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish dimensionless segment parameter from seconds, positive finite radius and invalid-vector throws, including inside and degenerate cases.
 * @evidence contracts/performance.md#efficient-algorithms A few dot products and quadratic roots give O(1) time and constant vector/scalar temporaries.
 * @evidence contracts/performance.md#reuse-equivalent-work projectileSphereHit shares this predicate for each chord; mutable endpoints and collider values prevent an identity-only intersection cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a number or null escapes, with no retained segment, collider, handle or asynchronous work.
 */
export const segmentSphere: (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  radius: number,
) => number | null = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  radius: number,
): number | null => {
  if (!Number.isFinite(radius))
    throw new RangeError(
      `segment sphere radius must be finite, but was ${radius}`,
    );
  if (!(radius > 0))
    throw new RangeError(
      `segment sphere radius must be > 0, but was ${radius}`,
    );
  assertFiniteVector("a", a);
  assertFiniteVector("b", b);
  assertFiniteVector("center", c);

  const d: IAutoMovieVector3 = Vector3.subtract(b, a);
  const m: IAutoMovieVector3 = Vector3.subtract(a, c);
  const A: number = Vector3.dot(d, d);
  const C: number = Vector3.dot(m, m) - radius * radius;
  if (A === 0) return C <= 0 ? 0 : null; // a == b: point test
  const B: number = 2 * Vector3.dot(m, d);
  const disc: number = B * B - 4 * A * C;
  if (disc < 0) return null;
  const root: number = Math.sqrt(disc);
  const s1: number = (-B - root) / (2 * A); // entry
  const s2: number = (-B + root) / (2 * A); // exit
  if (s1 >= 0 && s1 <= 1) return s1; // enters within the segment
  if (s1 < 0 && s2 >= 0) return 0; // a is inside the sphere
  return null; // intersection lies off the segment
};
