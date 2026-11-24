/**
 * Admit a positive normalized piecewise phase chart without changing its
 * coefficients. Cumulative boundaries must be representably increasing; only
 * the final endpoint absorbs the declared binary64 summation roundoff.
 */
export function compileAutoMovieNormalizedPhases64(
  widths: readonly number[],
  count: number,
): number[] {
  if (count < 1 || widths.length !== count)
    throw new Error("Phase widths must match the polynomial spans");
  const knots: number[] = [0];
  for (let i: number = 0; i < count; ++i) {
    const width: number = widths[i]!;
    const next: number = knots[i]! + width;
    if (width <= 0 || next <= knots[i]!)
      throw new Error("Phase widths require a resolvable positive partition");
    knots.push(next);
  }
  if (
    Math.abs(knots[count]! - 1) > 64 * count * Number.EPSILON ||
    knots[count - 1]! >= 1
  )
    throw new Error("Phase widths must cover one normalized turn");
  knots[count] = 1;
  return knots;
}
