import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanSkill } from "../skill/HumanSkill";

/** The alternatives of `WalkStepsTempoContext`'s site. */
type WalkStepsTempoContext = "skill" | "subject" | "series";

/**
 * The stream a take's tempo is drawn from: one per performer and per occurrence
 * of the action in their chain, keyed as a walk whatever the gait is called. A
 * style is the walk with a manner, so a stroll, a sad or a proud walk and the
 * neutral walk in the same place of the same chain under one seed draw the same
 * tempo, and differ only by their style.
 *
 * @param context The action's skill, subject and occurrence.
 * @returns The stream.
 */
export function walkStepsTempo(
  context: Pick<IAutoMovieMotionHumanActionContext, WalkStepsTempoContext>,
): IAutoMovieRandom {
  return HumanSkill.stream(
    context.skill,
    context.subject,
    "walk",
    context.series("period").index,
    "period",
  );
}
