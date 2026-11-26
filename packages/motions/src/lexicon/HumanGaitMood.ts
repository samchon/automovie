import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanGait,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { walk } from "../gait/internal/walk";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanGait } from "./HumanGait";

/** The alternatives of `MoodName`'s site. */
type MoodName = "sad" | "proud";

/**
 * A mood's gait: the normal walk in the manner preset of the mood's name, a
 * tempo factor slowing the speed by itself (the Froude number by its square),
 * with the mood's lean.
 */
export function HumanGaitMood(
  name: MoodName,
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IParams>,
): IAutoMovieMotionHumanWalkGait {
  const manner: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
    context,
    AutoMovieMotionManner.PRESETS[name],
  );
  const walking: IAutoMovieMotionHumanWalkGait = walk.walking(
    walk.FROUDE.normal / (manner.tempo * manner.tempo),
  );
  return {
    ...walking,
    step: (froude: number): number => manner.step * walking.step(froude),
    arms: {
      shoulder: manner.swing * walking.arms.shoulder,
      elbow: walking.arms.elbow,
      swing: manner.swing * walking.arms.swing,
    },
    lean: HumanGait.MOODS[name],
  };
}
