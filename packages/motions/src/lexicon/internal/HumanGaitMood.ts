import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanGait,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { walk } from "../../gait/internal/walk";
import { motionManner } from "../../compose/internal/motionManner";
import { HumanGait } from "./HumanGait";

/*
 * A mood's gait: the normal walk in the manner preset of the mood's name, a
 * tempo factor slowing the speed by itself (the Froude number by its square),
 * with the mood's lean.
 */
export function HumanGaitMood(
  name: MoodName,
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IParams>,
): IAutoMovieMotionHumanWalkGait {
  const manner: IAutoMovieMotionManner.IModifiers = motionManner(
    context,
    motionManner.PRESETS[name],
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

/*
 * The alternatives of `MoodName`'s site.
 */
type MoodName = "sad" | "proud";
