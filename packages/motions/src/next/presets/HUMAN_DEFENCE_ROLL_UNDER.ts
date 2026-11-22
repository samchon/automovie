import type { IAutoMovieMotionHumanDefence } from "@automovie/interface";

/**
 * The rollUnder preset: the body rolled under a hook. Spread into `defend`'s parameters beside the
 * rest that the composition gives; each value means what the law's member of
 * the same name does. The `rollUnder` row of `HumanDefence` fixes these values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own named member types as one `IDefendPreset`, so a preset fixes exactly its members and the law keeps every other default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanDefence.ROLL_UNDER`; the rollUnder row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_DEFENCE_ROLL_UNDER: IAutoMovieMotionHumanDefence.IDefendPreset =
  {
    kind: "roll",
  };
