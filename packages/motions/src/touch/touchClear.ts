import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * How deep a toucher's trunk and legs on a posture pass into the people
 * whose regions the hands touch, as they stand at the touch's entry, metres:
 * the stance's clearance (`IAutoMovieMotionHumanTouchStance.IProps.clear`).
 * It is read as the partner audit reads two bodies
 * (`AutoMovieMotionHumanAuditTangle.across`, both ways); the touching arms
 * and hands are left out, the arm planner keeping them clear.
 *
 * @param context The touch's context.
 * @param hands The hands and the targets they touch.
 * @returns The depth on a posture, 0 when clear; undefined when no hand touches another person.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is measured, against whom and when, how, what is left out and the absent case.
 * @evidence contracts/development/implementation.md#principled-implementation The partner audit's own two-way depth of one body's probes in the other's colliders, on the posture resolved and the partner's entry bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One partner list, then one reading a posture: resolve, two directed readings a partner, the deepest kept.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the arms and hands are left out, by their segments, since their clearance is the arm planner's; every other pair is read.
 * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve and the audit's sphere-screened pair reading a call; it is called only by a rising stance's plan-time search, never per frame.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanAuditTangle.across`, `resolveHumanPosture` and `poseBones`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader keeps the partners' readers and the entry second; each call's bones end with it.
 */
export function touchClear(
  context: Pick<IAutoMovieMotionHumanActionContext, "body" | "subject" | "start" | "performer">,
  hands: readonly [AutoMovieHumanSide, IAutoMovieMotionTarget][],
): ((posture: IAutoMovieMotionHumanPosture) => number) | undefined {
  const partners: IAutoMovieMotionHumanPerformerReader[] = [
    ...new Set(
      hands.flatMap(([, t]: [AutoMovieHumanSide, IAutoMovieMotionTarget]): string[] =>
        t.kind === "person" && t.subject !== context.subject ? [t.subject] : [],
      ),
    ),
  ].map((subject: string): IAutoMovieMotionHumanPerformerReader => context.performer(subject));
  if (partners.length === 0) return undefined;
  const body = context.body;
  return (posture: IAutoMovieMotionHumanPosture): number => {
    const mine = poseBones(body, resolveHumanPosture(body, posture));
    let deepest: number = 0;
    for (const partner of partners) {
      const theirs = partner.bones(context.start);
      for (const pair of AutoMovieMotionHumanAuditTangle.across(body, mine, partner.body, theirs))
        if (!REACHING.test(pair.a)) deepest = Math.max(deepest, pair.depth);
      for (const pair of AutoMovieMotionHumanAuditTangle.across(partner.body, theirs, body, mine))
        if (!REACHING.test(pair.b)) deepest = Math.max(deepest, pair.depth);
    }
    return deepest;
  };
}

/** The segments of the arms and hands, which the arm planner keeps out of a partner. */
const REACHING: RegExp = /(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/;
