import type { AutoMovieHumanActionUnit } from "../AutoMovieHumanActionUnit";
import type { AutoMovieHumanExpressionSide } from "../AutoMovieHumanExpressionSide";

/** One action unit acting at one intensity on one or both sides. */
export interface IAutoMovieHumanActionUnitActivation {
  /** The action unit. */
  unit: AutoMovieHumanActionUnit;

  /**
   * Intensity from rest (0) to maximum (1). The FACS letter grades A (trace) to
   * E (maximum) fall at about 0.2, 0.4, 0.6, 0.8 and 1. Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  intensity: number;

  /**
   * Which side acts, as the person's own left and right; `both` acts
   * symmetrically.
   */
  side: AutoMovieHumanExpressionSide;
}
