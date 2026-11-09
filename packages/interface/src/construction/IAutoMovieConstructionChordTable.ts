/**
 * A chord from a join's curve to one rail that varies round the loop: values at uniform curve parameters from 0, read between them by the periodic cubic B-spline through them, so the width law is C2 round the loop.
 *
 * Engine admission: at least four values, each positive.
 *
 * @evidence contracts/development/design.md#principled-representation A width law sampled at uniform parameters and interpolated by a periodic C2 spline keeps the rails, and so the blend, smooth round the loop.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One value list replaces a function, which an authoring record cannot hold.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Values are inputs from the parts' sizes; the table is not fitted to a specimen's blend.
 * @evidence contracts/development/common.md#meaningful-documentation States the values' placement, their interpolant, units and admission.
 */
export interface IAutoMovieConstructionChordTable {
  /** Discriminator. */
  type: "chords";

  /** Chords in metres at the curve parameters `2 pi k / n` from 0, `n` their count, at least four, each positive. */
  values: number[];
}
