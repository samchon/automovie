import type { IAutoMovieProficiency } from "./IAutoMovieProficiency";

/**
 * A performer's resolved overall and per-axis proficiency in [0, 1], with the seed shared by deterministic action variation. HumanSkill.resolve produces this record; action families own their measured interpolation endpoints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A performer's resolved overall and per-axis proficiency in [0, 1], with the seed shared by deterministic action variation. HumanSkill.resolve produces this record; action families own their measured interpolation endpoints.
 * @evidence contracts/development/design.md#principled-representation p: The overall value in [0, 1]. axes: Each axis's value in [0, 1]. seed: The chain seed every draw starts from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanSkill.resolve produces the resolved profile read by reaching, reacting, striking and ensemble planning; action-family study endpoints stay with each family.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contract keeps every resolved axis explicit and never changes a body's range of motion. HumanSkill owns profile resolution and seeded quantity sampling.
 */
export interface IAutoMovieMotionHumanSkill {
  /** The overall value in [0, 1]. */
  p: number;

  /** Each axis's value in [0, 1]. */
  axes: Readonly<Record<IAutoMovieProficiency.Axis, number>>;

  /** The chain seed every draw starts from. */
  seed: string;
}
