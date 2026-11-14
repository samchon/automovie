import type { IAutoMovieAngleRange } from "@automovie/interface";

/**
 * The full-turn alias of an angle nearest an interval: one inside it when
 * any is, the angle itself first; otherwise the alias with the least
 * overshoot, the lower one on a tie. A `null` interval is the immobile one,
 * which admits only 0. No angle is clamped.
 *
 * The nearest alias matters for an interval no alias can hit exactly. An
 * immobile axis admits only 0, and an extraction returns its half turn as
 * 180 degrees less a rounding error, so the alternate chart's 360 degrees
 * less that error has no alias at exactly 0; left unaliased it would score a
 * full turn of overshoot and lose a chart choice to a far worse chart, on
 * rounding noise alone.
 *
 * @param angle Degrees.
 * @param range The interval, degrees; `null` for an immobile axis.
 * @returns The alias, degrees.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the alias chosen, the tie, the immobile case, that nothing is clamped and why the nearest alias matters.
 * @evidence contracts/development/implementation.md#principled-implementation The aliases inside an interval are the whole turns between its ends, so the least and the greatest are two roundings; with none inside, the two neighbours of the interval are compared by their overshoot.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two roundings and one comparison.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angle is only shifted by whole turns, never moved into the interval.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The one alias owner, read by the joint inverse's chart choice and by the swing-twist range's twist.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
