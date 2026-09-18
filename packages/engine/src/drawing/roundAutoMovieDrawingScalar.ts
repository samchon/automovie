import { AUTOMOVIE_DRAWING_DECIMALS } from "./AUTOMOVIE_DRAWING_DECIMALS";

/**
 * Round one drawing scalar onto the fixed output grid.
 *
 * Negative zero is normalized away: `-0` and `0` are different strings, and a
 * digest over stringified coordinates would disagree with itself depending on
 * which side of an axis a wall happened to be built.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Stabilizes every reported drawing scalar on the fixed precision grid and prevents negative zero from changing serialized evidence.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Rounds through `AUTOMOVIE_DRAWING_DECIMALS` and canonicalizes a resulting `-0` to `0`.
 */
export const roundAutoMovieDrawingScalar = (value: number): number => {
  const factor = 10 ** AUTOMOVIE_DRAWING_DECIMALS;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};
