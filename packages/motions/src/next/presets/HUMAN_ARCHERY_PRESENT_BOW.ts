import type { IAutoMovieMotionHumanArchery } from "@automovie/interface";

/**
 * The present bow preset: the bow held out in one hand with the line of aim from the face, its `rest` as the point the line from `nock` passes through, the bow arm extended. The `presentBow` row of `HumanArchery` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanArchery.IPresentBowPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanArchery.PRESENT_BOW`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_ARCHERY_PRESENT_BOW: IAutoMovieMotionHumanArchery.IPresentBowPreset =
  {
    anchor: "face",
    hands: 1,
    from: "nock",
    tip: "rest",
    edge: "grip",
    extended: true,
  };
