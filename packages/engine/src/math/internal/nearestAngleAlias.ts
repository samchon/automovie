import type { IAutoMovieAngleRange } from "@automovie/interface";

/*
 * The full-turn alias of an angle nearest an interval: one inside it when any
 * is, the angle itself first; otherwise the alias with the least overshoot, the
 * lower one on a tie. A `null` interval is the immobile one, which admits only
 * 0. No angle is clamped.
 *
 * The nearest alias matters for an interval no alias can hit exactly. An
 * immobile axis admits only 0, and an extraction returns its half turn as 180
 * degrees less a rounding error, so the alternate chart's 360 degrees less that
 * error has no alias at exactly 0; left unaliased it would score a full turn of
 * overshoot and lose a chart choice to a far worse chart, on rounding noise
 * alone.
 * Parameter angle: Degrees.
 * Parameter range: The interval, degrees; `null` for an immobile axis.
 * Returns: The alias, degrees.
 */
export function nearestAngleAlias(
  angle: number,
  range: IAutoMovieAngleRange | null,
): number {
  const minimum: number = range?.min ?? 0;
  const maximum: number = range?.max ?? 0;
  if (angle >= minimum && angle <= maximum) return angle;
  const first: number = Math.ceil((minimum - angle) / 360);
  const last: number = Math.floor((maximum - angle) / 360);
  if (first <= last) return angle + 360 * Math.max(first, Math.min(last, 0));
  // No alias is inside: `last` is the nearest one below the interval and
  // `first` the nearest one above it.
  const below: number = angle + 360 * last;
  const above: number = angle + 360 * first;
  return minimum - below <= above - maximum ? below : above;
}
