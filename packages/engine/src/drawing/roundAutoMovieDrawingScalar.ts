import { AUTOMOVIE_DRAWING_DECIMALS } from "./constants/AUTOMOVIE_DRAWING_DECIMALS";

/**
 * Round one drawing scalar onto the fixed output grid.
 *
 * Negative zero is normalized away: `-0` and `0` are different strings, and a
 * digest over stringified coordinates would disagree with itself depending on
 * which side of an axis a wall happened to be built.
 */
export const roundAutoMovieDrawingScalar = (value: number): number => {
  const factor = 10 ** AUTOMOVIE_DRAWING_DECIMALS;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};
