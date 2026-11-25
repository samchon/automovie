import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The mountain pose preset of `stand`: standing still for ten seconds, the yoga
 * pose held. Spread into `stand`'s parameters; the `mountainPose` row of
 * `HumanSportWorkout` fixes this hold. The ten seconds are provisional until a
 * yoga source for the held mountain pose is read.
 */
export const HUMAN_STANCE_MOUNTAIN_POSE: IAutoMovieMotionHumanStance.IStandPreset =
  {
    hold: 10,
  };
