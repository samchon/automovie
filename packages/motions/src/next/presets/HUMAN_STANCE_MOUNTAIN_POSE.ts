import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The mountain pose preset of `stand`: standing still for ten seconds, the
 * yoga pose held. Spread into `stand`'s parameters; the `mountainPose` row of
 * `HumanSportWorkout` fixes this hold. The ten seconds are provisional until a
 * yoga source for the held mountain pose is read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hold the preset fixes in seconds, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The stand law's own `hold`, in seconds, as one `IStandPreset`, so it fits any body as `stand` does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStance.MOUNTAIN_POSE`; the `mountainPose` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STANCE_MOUNTAIN_POSE: IAutoMovieMotionHumanStance.IStandPreset =
  {
    hold: 10,
  };
