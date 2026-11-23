import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The risingElbow preset: a rising elbow with the rear arm. Spread into
 * `closeStrike`'s parameters beside the rest that the composition gives; each
 * value means what the law's member of the same name does. The `risingElbow`
 * row of `HumanStrike` fixes these values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own named member types as one `ICloseStrikePreset`, so a preset fixes exactly its members and the law keeps every other default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStrike.RISING_ELBOW`; the risingElbow row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STRIKE_RISING_ELBOW: IAutoMovieMotionHumanStrike.ICloseStrikePreset =
  {
    technique: "risingElbow",
    arm: "rear",
  };
