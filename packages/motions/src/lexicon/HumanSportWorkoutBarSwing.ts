import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { workout } from "../exercise/workout";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * A swing on a bar. Default 3 repetitions of 1.9 s after a 1 s entry;
 * provisional ({@link WorkoutHanging.KINDS}).
 */
export const HumanSportWorkoutBarSwing: IAutoMovieMotionHumanActionLaw<
  IAutoMovieMotionHumanLexiconParams["sportWorkout"]["barSwing"]
> = HumanActionRow("barSwing", workout, {
  kind: "barSwing",
});
