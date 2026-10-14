import {
  IAutoMovieActionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveTargetPoint } from "../perform/resolveTargetPoint";
import { IPerformShotGateContext } from "./IPerformShotGateContext";

/**
 * The world point of a target the input gate already resolved, at the shot's opening.
 *
 * The live resolver answers first when it is supplied and returns a point; otherwise the staged placements and opening formation points answer. The target must have passed {@link resolvePerformShotTarget}, which proved one of the two resolved to a finite point. The non-null return additionally relies on staged inputs remaining unchanged and targetAt answering consistently; this repeat query does not cache or revalidate its callback's answer. `performShot` reads a `frame` focus through it and the subject framer reads every camera subject, so both name the point the gate accepted.
 *
 * @param context The shot's staged tables.
 * @param target A target the input gate resolved.
 * @returns The target's world point in metres at time `0`.
 *
 * @evidence contracts/common.md#principled-implementation Repeats the gate's live-resolver then staged-lookup precedence at time zero. Its asserted non-null result relies on unchanged tables and a consistent live resolver; an arbitrary stateful callback is not made stable by the earlier gate.
 * @evidence contracts/common.md#clear-and-simple-design One post-gate read shared by the focus intent and the subject framer, replacing two inline copies of the precedence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default point is substituted; the caller must preserve the earlier resolution premise because this helper does not revalidate a stateful callback or repair a missing answer.
 * @evidence contracts/common.md#meaningful-documentation States the precedence, the instant, the precondition that makes the result total, and both readers.
 * @evidence contracts/performance.md#efficient-algorithms One live query or one table lookup, plus a group's member mean when the target is a group.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One read per call; the tables it reads are the shared context's.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned point may be a staged vector the caller only reads.
 */
export function resolvedPerformShotPoint(
  context: IPerformShotGateContext,
  target: IAutoMovieActionTarget,
): IAutoMovieVector3 {
  const live: IAutoMovieVector3 | null | undefined = context.targetAt?.(
    target,
    0,
  );
  if (live !== null && live !== undefined) return live;
  return resolveTargetPoint(
    target,
    context.nodePositions,
    context.formationPoints,
  )!;
}
