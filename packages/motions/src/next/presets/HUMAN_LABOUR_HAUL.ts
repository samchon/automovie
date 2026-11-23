import type { IAutoMovieMotionHumanLabour } from "@automovie/interface";

/**
 * The haul preset: both hands carry a load of 0.25 of the body mass, the most a
 * carry accepts, at the `slow` walk (about 0.82 m/s); labour, strain. Spread
 * into `carry`'s parameters with the destination; the `haul` row of
 * `HumanLabour` fixes these values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the grip, pace and load the preset fixes with their results, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The carry's own grip, pace and load as one `IHaulPreset`, so it fits any body as the carry does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanLabour.HAUL`; the haul row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_LABOUR_HAUL: IAutoMovieMotionHumanLabour.IHaulPreset = {
  kind: "twoHands",
  pace: "slow",
  load: 0.25,
};
