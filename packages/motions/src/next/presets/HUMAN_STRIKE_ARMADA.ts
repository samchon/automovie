import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The armada preset: capoeira's armada, a whole turn and then the rear leg's
 * straight sweep outward. Spread into `footStrike`'s parameters beside the rest
 * that the composition gives; each value means what the law's member of the
 * same name does. The `armada` row of `HumanStrike` fixes these values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own named member types as one `IFootStrikePreset`, so a preset fixes exactly its members and the law keeps every other default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStrike.ARMADA`; the armada row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STRIKE_ARMADA: IAutoMovieMotionHumanStrike.IFootStrikePreset =
  {
    technique: "hook",
    leg: "rear",
    spin: true,
  };
