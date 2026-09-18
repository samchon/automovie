import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";

const VECTOR_AXES = ["x", "y", "z"] as const;

const assertFiniteVector = (name: string, vector: IAutoMovieVector3): void => {
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
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-collision-proxies Tests a bounded segment against the declared spherical proxy.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Computes the first world contact without persistent solver state.
 * @author Samchon
 */
export const segmentSphere = (
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

  const d = Vector3.subtract(b, a);
  const m = Vector3.subtract(a, c);
  const A = Vector3.dot(d, d);
  const C = Vector3.dot(m, m) - radius * radius;
  if (A === 0) return C <= 0 ? 0 : null; // a == b: point test
  const B = 2 * Vector3.dot(m, d);
  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;
  const root = Math.sqrt(disc);
  const s1 = (-B - root) / (2 * A); // entry
  const s2 = (-B + root) / (2 * A); // exit
  if (s1 >= 0 && s1 <= 1) return s1; // enters within the segment
  if (s1 < 0 && s2 >= 0) return 0; // a is inside the sphere
  return null; // intersection lies off the segment
};
