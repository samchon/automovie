/**
 * Decimal places every page coordinate, area and length is rounded to.
 *
 * A drawing is evidence, and evidence that differs in its sixteenth decimal
 * between two runs is not comparable by digest. Six places is a micrometre at
 * building scale: finer than any construction tolerance and coarse enough that
 * the last bits of an accumulated dot product cannot move it.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Fixes page coordinates and measurements to six decimal places so identical drawing inputs retain comparable values and digests.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Defines the `10^-6` output grid applied to deterministic drawing coordinates, lengths, and areas.
 */
export const AUTOMOVIE_DRAWING_DECIMALS = 6;
