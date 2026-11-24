import type { AutoMovieVector2Tuple } from "@automovie/interface";

/**
 * The distance from `q` to the nearest point of a curve on `[a, b]`.
 *
 * An independent geometric oracle: scan the complete parameter interval, then
 * refine its best cell by ternary search. Small analytic arcs have no rapid
 * oscillation, so the 128-cell scan identifies the nearest basin.
 */
export function measureRecoveryCurveNearest(
  q: Readonly<AutoMovieVector2Tuple>,
  evaluate: (t: number) => Readonly<AutoMovieVector2Tuple>,
  a: number,
  b: number,
): number {
  const separation: (t: number) => number = (t: number): number => {
    const p: Readonly<AutoMovieVector2Tuple> = evaluate(t);
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  };
  let index: number = 0;
  let best: number = Infinity;
  for (let i: number = 0; i <= 128; ++i) {
    const value: number = separation(a + ((b - a) * i) / 128);
    if (value < best) {
      best = value;
      index = i;
    }
  }
  let low: number = a + ((b - a) * Math.max(0, index - 1)) / 128;
  let high: number = a + ((b - a) * Math.min(128, index + 1)) / 128;
  for (let i: number = 0; i < 64; ++i) {
    const left: number = (2 * low + high) / 3;
    const right: number = (low + 2 * high) / 3;
    if (separation(left) < separation(right)) high = right;
    else low = left;
  }
  return Math.min(best, separation((low + high) / 2));
}
