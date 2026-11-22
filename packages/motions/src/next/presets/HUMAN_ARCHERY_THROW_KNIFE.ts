import type { IAutoMovieMotionHumanArchery } from "@automovie/interface";

/**
 * The throw knife preset: a knife thrown overarm and spinning whole half turns over the flight to the target. The `throwKnife` row of `HumanThrownWeapon` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanArchery.IKnifePreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanArchery.THROW_KNIFE`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_ARCHERY_THROW_KNIFE: IAutoMovieMotionHumanArchery.IKnifePreset =
  { style: "overarm", attitude: { kind: "turns" } };
