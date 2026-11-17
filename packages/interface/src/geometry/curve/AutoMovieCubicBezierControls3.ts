import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Four cubic Bernstein coefficients in P0, P1, P2, P3 order, in the enclosing field units; P1 and P2 are handles rather than interpolated samples.
 *
 * @evidence contracts/development/design.md#principled-representation Four ordered controls are the complete degree-three Bernstein coefficient field.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The same tuple shape represents position controls and their longitudinal first variation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias neither fits sampled points nor claims a regular or nonintersecting cubic.
 * @evidence contracts/development/common.md#meaningful-documentation Names the coefficient order, handle meaning and enclosing field units.
 */
export type AutoMovieCubicBezierControls3 = readonly [
  Readonly<AutoMovieVector3Tuple>,
  Readonly<AutoMovieVector3Tuple>,
  Readonly<AutoMovieVector3Tuple>,
  Readonly<AutoMovieVector3Tuple>,
];
