import { AutoMovieEngineDrawingDecimals } from "../AutoMovieEngineDrawingDecimals";

/*
 * Round one drawing scalar onto the fixed output grid of
 * AutoMovieEngineDrawingDecimals decimal places.
 *
 * Halves round towards positive infinity, as `Math.round` does, and negative
 * zero is normalized to zero: `-0` and `0` stringify differently in a digest's
 * input, so without it a digest would depend on which side of an axis a value
 * approached from.
 * Parameter value: Scalar in the drawing's units, usually metres or square metres.
 * Returns: The value on the grid, never `-0`.
 */
export const roundAutoMovieDrawingScalar = (value: number): number => {
  const rounded: number = Math.round(value * FACTOR) / FACTOR;
  return Object.is(rounded, -0) ? 0 : rounded;
};

/*
 * `10 ^ AutoMovieEngineDrawingDecimals`, the grid's steps per metre.
 */
const FACTOR: number = 10 ** AutoMovieEngineDrawingDecimals;
