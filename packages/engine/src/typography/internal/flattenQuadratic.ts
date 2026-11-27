import type { AutoMovieVector2Tuple } from "@automovie/interface";

/*
 * Replace a quadratic Bézier arc by chords at equal parameter steps, with the
 * fewest steps whose chord error stays within `tolerance`.
 *
 * For `B(t) = (1−t)²P0 + 2t(1−t)P1 + t²P2` the second derivative is the
 * constant `2(P0 − 2P1 + P2)`, so a chord over a parameter step `h` departs
 * from the arc by at most `|P0 − 2P1 + P2| h² / 4`. With `n` equal steps, `h =
 * 1/n`, the error is at most `|P0 − 2P1 + P2| / (4n²)`, and `n = ⌈√(|P0 − 2P1 +
 * P2| / (4 · tolerance))⌉`, at least one, keeps it within `tolerance`. A
 * straight piece, whose control is its midpoint, takes one step.
 *
 * Units are the caller's; glyph geometry passes metres.
 * Parameter start: On-curve start `P0`.
 * Parameter control: Control point `P1`.
 * Parameter end: On-curve end `P2`.
 * Parameter tolerance: Positive largest chord error.
 * Returns: `n + 1` points from `start` to `end`, both included, as new tuples.
 * A non-finite point or a nonpositive or non-finite tolerance.
 */
export function flattenQuadratic(
  start: Readonly<AutoMovieVector2Tuple>,
  control: Readonly<AutoMovieVector2Tuple>,
  end: Readonly<AutoMovieVector2Tuple>,
  tolerance: number,
): AutoMovieVector2Tuple[] {
  if (tolerance <= 0)
    throw new Error(
      `Curve flattening tolerance must be finite and positive, not ${tolerance}`,
    );
  const bend: number = Math.hypot(
    start[0] - 2 * control[0] + end[0],
    start[1] - 2 * control[1] + end[1],
  );
  const steps: number = Math.max(
    1,
    Math.ceil(Math.sqrt(bend / (4 * tolerance))),
  );
  const points: AutoMovieVector2Tuple[] = [[start[0], start[1]]];
  for (let step: number = 1; step < steps; ++step) {
    const t: number = step / steps;
    const u: number = 1 - t;
    points.push([
      u * u * start[0] + 2 * t * u * control[0] + t * t * end[0],
      u * u * start[1] + 2 * t * u * control[1] + t * t * end[1],
    ]);
  }
  points.push([end[0], end[1]]);
  return points;
}
