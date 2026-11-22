import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * One or more rhythmic heel raises from a seated position with both feet planted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the moving foot and gives units and admission for the beat count, rate and peak rotation.
 * @evidence contracts/development/design.md#principled-representation Whole cycles have an authored count, a frequency in beats per second and a peak angle in degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The heel-bounce action reads only these four authoring inputs and inherits its seat and floor.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the canonical side type; the law admits cadence and tests rotation against the seated limb's reach.
 */
export interface IAutoMovieMotionHumanSeatedHeelBounce {
  /** The moving leg; the opposite foot remains planted. */
  side: AutoMovieHumanSide;

  /** The positive integer number of raises and returns. */
  count: number;

  /** Positive finite beats per second. */
  cadence: number;

  /** Peak heel rocker, in positive degrees; limited by the fitted leg's range. */
  amplitude: number;
}
