import type { IAutoMovieMotionHumanArchery } from "@automovie/interface";

/**
 * The throw javelin preset: a javelin or a spear thrown overarm at the middle
 * of the elite release angles Campos, Brizuela and Ramon (2004) measured at the
 * 1999 World Championships (27.7 to 40.1 degrees), 33.9 degrees, the shaft
 * along its velocity. The `throwJavelin` and `throwSpear` rows of
 * `HumanThrownWeapon` read it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanArchery.IJavelinPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanArchery.THROW_JAVELIN`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_ARCHERY_THROW_JAVELIN: IAutoMovieMotionHumanArchery.IJavelinPreset =
  {
    style: "overarm",
    angle: (27.7 + 40.1) / 2,
    attitude: { kind: "velocity" },
  };
