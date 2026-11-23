import type { AutoMovieVector3Tuple } from "../../index";

/** Cubic endpoint data on its enclosing curve's positive phase interval. */
export interface IAutoMovieRecoveryHermiteSpan {
  /** Start position, millimetres in the original spatial frame. */
  start: Readonly<AutoMovieVector3Tuple>;

  /** End position, millimetres in the original spatial frame. */
  end: Readonly<AutoMovieVector3Tuple>;

  /** Start dP/ds, millimetres per enclosing phaseUnit. */
  startDerivative: Readonly<AutoMovieVector3Tuple>;

  /** End dP/ds, millimetres per enclosing phaseUnit. */
  endDerivative: Readonly<AutoMovieVector3Tuple>;
}
