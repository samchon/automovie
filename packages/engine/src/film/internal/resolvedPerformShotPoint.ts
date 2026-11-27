import {
  IAutoMovieActionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieEngineFilmTypes } from "../AutoMovieEngineFilmTypes";

import { resolveTargetPoint } from "../../perform/internal/resolveTargetPoint";

/*
 * The world point of a target the input gate already resolved, at the shot's
 * opening.
 *
 * The live resolver answers first when it is supplied and returns a point;
 * otherwise the staged placements and opening formation points answer. The
 * target must have passed resolvePerformShotTarget, which proved one of
 * the two resolved to a finite point. The non-null return additionally relies
 * on staged inputs remaining unchanged and targetAt answering consistently;
 * this repeat query does not cache or revalidate its callback's answer.
 * `performShot` reads a `frame` focus through it and the subject framer reads
 * every camera subject, so both name the point the gate accepted.
 * Parameter context: The shot's staged tables.
 * Parameter target: A target the input gate resolved.
 * Returns: The target's world point in metres at time `0`.
 */
export function resolvedPerformShotPoint(
  context: AutoMovieEngineFilmTypes.IResolvedPerformShotPointContext,
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
