import type { IAutoMovieMotionHumanArchery } from "@automovie/interface";

/**
 * The present bow preset: the bow held out in one hand with the line of aim
 * from the face, its `rest` as the point the line from `nock` passes through,
 * the bow arm extended. The `presentBow` row of `HumanArchery` reads it, so the
 * row and the preset share one value.
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
