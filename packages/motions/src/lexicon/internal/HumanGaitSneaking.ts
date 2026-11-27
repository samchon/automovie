import type { IAutoMovieMotionHumanWalkGait } from "@automovie/interface";

import { walk } from "../../gait/internal/walk";
import { HumanGait } from "./HumanGait";

/*
 * The sneak's slow short steps with the arms held close (`HumanGait.SNEAK`),
 * with what the variant adds: its pelvis drop or its raised heels.
 */
export function HumanGaitSneaking(
  variant: Partial<IAutoMovieMotionHumanWalkGait>,
): IAutoMovieMotionHumanWalkGait {
  const walking: IAutoMovieMotionHumanWalkGait = walk.walking(
    HumanGait.SNEAK.froude,
  );
  return {
    ...walking,
    step: (froude: number): number =>
      HumanGait.SNEAK.step * walking.step(froude),
    arms: HumanGait.SNEAK.arms,
    ...variant,
  };
}
