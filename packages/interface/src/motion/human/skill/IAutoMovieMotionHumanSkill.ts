import type { IAutoMovieProficiency } from "./IAutoMovieProficiency";

/**
 * A performer's resolved overall and per-axis proficiency in [0, 1], with the
 * seed shared by deterministic action variation. HumanSkill.resolve produces
 * this record; action families own their measured interpolation endpoints.
 */
export interface IAutoMovieMotionHumanSkill {
  /** The overall value in [0, 1]. */
  p: number;

  /** Each axis's value in [0, 1]. */
  axes: Readonly<Record<IAutoMovieProficiency.Axis, number>>;

  /** The chain seed every draw starts from. */
  seed: string;
}
