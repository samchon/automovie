import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanSkill } from "../skill/HumanSkill";

/**
 * The stream a take's tempo is drawn from: one per performer and per
 * occurrence of the action in their chain, keyed as a walk whatever the
 * gait is called. A style is the walk with a manner, so a stroll, a sad or
 * a proud walk and the neutral walk in the same place of the same chain
 * under one seed draw the same tempo, and differ only by their style.
 *
 * @param context The action's skill, subject and occurrence.
 * @returns The stream.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is drawn, what keys it and why a style shares the walk's draw.
 * @evidence contracts/development/implementation.md#principled-implementation A draw keyed by stable identities (seed, performer, occurrence), so adding or renaming a style leaves every other take's tempo unchanged.
 * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One call.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The occurrence is the action's own ordinal among its name's uses in the chain, so the first stroll pairs with the first walk of a chain written with a walk in its place.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function walkStepsTempo(
  context: Pick<IAutoMovieMotionHumanActionContext, "skill" | "subject" | "series">,
): IAutoMovieRandom {
  return HumanSkill.stream(
    context.skill,
    context.subject,
    "walk",
    context.series("period").index,
    "period",
  );
}
