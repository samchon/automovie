import { tags } from "typia";

import { AutoMovieHumanActionUnit } from "../../typings/AutoMovieHumanActionUnit";
import { AutoMovieHumanExpressionSide } from "../../typings/AutoMovieHumanExpressionSide";

/**
 * One action unit acting at one intensity on one or both sides.
 */
export interface IAutoMovieHumanActionUnitActivation {
  /** The action unit. */
  unit: AutoMovieHumanActionUnit;

  /**
   * Intensity from rest (0) to maximum (1). The FACS letter grades A (trace) to E (maximum) fall at about 0.2, 0.4, 0.6, 0.8 and 1.
   */
  intensity: number & tags.Minimum<0> & tags.Maximum<1>;

  /**
   * Which side acts, as the person's own left and right; `both` acts symmetrically.
   */
  side: AutoMovieHumanExpressionSide;
}
