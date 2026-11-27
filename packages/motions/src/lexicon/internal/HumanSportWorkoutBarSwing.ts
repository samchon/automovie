import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { workout } from "../../exercise/internal/workout";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";

/**
 * A swing on a bar. Default 3 repetitions of 1.9 s after a 1 s entry;
 * provisional ({@link WorkoutHanging.KINDS}).
 */
export const HumanSportWorkoutBarSwing: IAutoMovieMotionHumanActionLaw<
  IAutoMovieMotionHumanLexiconParams["sportWorkout"]["barSwing"]
> = AutoMovieMotionHumanActionRow.of("barSwing", workout, {
  kind: "barSwing",
});
