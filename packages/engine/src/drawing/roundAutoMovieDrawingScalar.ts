import { AUTOMOVIE_DRAWING_DECIMALS } from "./constants/AUTOMOVIE_DRAWING_DECIMALS";

/** `10 ^ AUTOMOVIE_DRAWING_DECIMALS`, the grid's steps per metre. */
const FACTOR: number = 10 ** AUTOMOVIE_DRAWING_DECIMALS;

/**
 * Round one drawing scalar onto the fixed output grid of
 * {@link AUTOMOVIE_DRAWING_DECIMALS} decimal places.
 *
 * Halves round towards positive infinity, as `Math.round` does, and negative
 * zero is normalized to zero: `-0` and `0` stringify differently in a digest's
 * input, so without it a digest would depend on which side of an axis a value
 * approached from.
 *
 * @param value Scalar in the drawing's units, usually metres or square metres.
 * @returns The value on the grid, never `-0`.
 *
 * @evidence contracts/common.md#principled-implementation Scales by a power of ten, rounds with `Math.round` and scales back, the standard fixed-decimal rounding; the limitation is that binary floating point cannot hold most decimal fractions exactly, so the result is the nearest double to the grid value, which is stable across runs and machines because every step is IEEE-754 exact rounding.
 * @evidence contracts/common.md#clear-and-simple-design One rounding rule for every coordinate, length, area and welding key in the drawing folder, so two derivations of one design produce one set of numbers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No value is special-cased; the negative-zero normalization follows from `Object.is` distinguishing the two zeros, not from a particular fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the precision, the tie rule, the negative-zero normalization and why it matters, and the never-`-0` result.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A multiplication, a rounding and a division, so there is no algorithm to choose; the factor is computed once at module load.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One multiply, round and divide per value; memoizing scalars would grow a table without bound to save three operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Works on one number and a module constant fixed at load, so there is no per-call state to bound or free.
 * @author Samchon
 */
export const roundAutoMovieDrawingScalar = (value: number): number => {
  const rounded: number = Math.round(value * FACTOR) / FACTOR;
  return Object.is(rounded, -0) ? 0 : rounded;
};
