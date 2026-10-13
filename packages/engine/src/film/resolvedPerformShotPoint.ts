import { IAutoMovieActionTarget, IAutoMovieVector3 } from "@automovie/interface";

import { resolveTargetPoint } from "../perform/resolveTargetPoint";
import { IPerformShotGateContext } from "./IPerformShotGateContext";

/**
 * The world point of a target the input gate already resolved, at the shot's
 * opening.
 *
 * The live resolver answers first when it is supplied and returns a point;
 * otherwise the staged placements and opening formation points answer. The
 * target must have passed {@link resolvePerformShotTarget}, which proved one of
 * the two resolves to a finite point, so the result is never missing.
 * `performShot` reads a `frame` focus through it and the subject framer reads
 * every camera subject, so both name the point the gate accepted.
 *
 * @param context The shot's staged tables.
 * @param target A target the input gate resolved.
 * @returns The target's world point in metres at time `0`.
 *
 * @evidence contracts/common.md#principled-implementation The same precedence the gate resolved with, live resolver then staged lookup, evaluated at the same instant `0`, so the point read after the gate equals the point the gate accepted; the non-null result is the gate's proven postcondition.
 * @evidence contracts/common.md#clear-and-simple-design One post-gate read shared by the focus intent and the subject framer, replacing two inline copies of the precedence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No target kind is special-cased and no default point is substituted; the missing case is excluded by the gate rather than papered over here.
 * @evidence contracts/common.md#meaningful-documentation States the precedence, the instant, the precondition that makes the result total, and both readers.
 * @evidence contracts/performance.md#efficient-algorithms One live query or one table lookup, plus a group's member mean when the target is a group.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One read per call; the tables it reads are the shared context's.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned point may be a staged vector the caller only reads.
 */
export const resolvedPerformShotPoint = (
  context: IPerformShotGateContext,
  target: IAutoMovieActionTarget,
): IAutoMovieVector3 => {
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
};
