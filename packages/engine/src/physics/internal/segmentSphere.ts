import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * First intersection of the segment `a→b` with a sphere, as the parameter `s ∈
 * [0, 1]` where contact begins (`a + s·(b−a)`), or `null` if the segment never
 * touches the sphere. If `a` already lies inside, returns `0`.
 *
 * Solves `|a + s·d − c|² = r²` (a quadratic in `s`) and returns the entry root
 * that falls within the segment. A degenerate segment (`a == b`) reduces to a
 * point-in-sphere test.
 */
export function segmentSphere(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  radius: number,
): number | null {
  if (radius <= 0)
    throw new RangeError(
      `segment sphere radius must be > 0, but was ${radius}`,
    );

  const d: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(b, a);
  const m: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(a, c);
  const A: number = AutoMovieEngineVector3.dot(d, d);
  const C: number = AutoMovieEngineVector3.dot(m, m) - radius * radius;
  if (A === 0) return C <= 0 ? 0 : null; // a == b: point test
  const B: number = 2 * AutoMovieEngineVector3.dot(m, d);
  const disc: number = B * B - 4 * A * C;
  if (disc < 0) return null;
  const root: number = Math.sqrt(disc);
  const s1: number = (-B - root) / (2 * A); // entry
  const s2: number = (-B + root) / (2 * A); // exit
  if (s1 >= 0 && s1 <= 1) return s1; // enters within the segment
  if (s1 < 0 && s2 >= 0) return 0; // a is inside the sphere
  return null; // intersection lies off the segment
}
