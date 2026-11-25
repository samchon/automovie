import {
  IAutoMovieActionTarget,
  type IAutoMovieEnginePerformShotGateContext,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveTargetPoint } from "../perform/resolveTargetPoint";

/** Inputs used to resolve an already-gated framing target. */
type TargetPointContext = Pick<
  IAutoMovieEnginePerformShotGateContext,
  "targetAt" | "nodePositions" | "formationPoints"
>;

/**
 * The world point of a target the input gate already resolved, at the shot's
 * opening.
 *
 * The live resolver answers first when it is supplied and returns a point;
 * otherwise the staged placements and opening formation points answer. The
 * target must have passed {@link resolvePerformShotTarget}, which proved one of
 * the two resolved to a finite point. The non-null return additionally relies
 * on staged inputs remaining unchanged and targetAt answering consistently;
 * this repeat query does not cache or revalidate its callback's answer.
 * `performShot` reads a `frame` focus through it and the subject framer reads
 * every camera subject, so both name the point the gate accepted.
 *
 * @param context The shot's staged tables.
 * @param target A target the input gate resolved.
 * @returns The target's world point in metres at time `0`.
 */
export function resolvedPerformShotPoint(
  context: TargetPointContext,
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
