import type { IAutoMovieRecoveryOpenRunsPreparationOperation } from "@automovie/interface";

import { prepareRecoveryLocalContinuation } from "./prepareRecoveryLocalContinuation";

/*
 * Admit the interpolation policy before adapting the shared continuation map
 * to the public ordinary-run result.
 */
export function prepareRecoveryOpenRuns(
  bundle: Parameters<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation>[0],
  graph: Parameters<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation>[1],
  operator: Parameters<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation>[2],
): ReturnType<IAutoMovieRecoveryOpenRunsPreparationOperation.Operation> {
  if (
    (operator !== "quadratic" && operator !== "ruled") ||
    !(bundle.policy.toleranceMm > 0)
  )
    throw new Error(
      "Explicit interpolation and a positive physical approximation budget required",
    );
  const {
    outgoing,
    incoming,
    pairs,
    unsupportedGroups,
    unsupportedGroupsWithOpenArcs,
  }: ReturnType<typeof prepareRecoveryLocalContinuation> =
    prepareRecoveryLocalContinuation(bundle, graph);
  return {
    outgoing,
    incoming,
    pairs,
    unsupportedGroups,
    unsupportedGroupsWithOpenArcs,
  };
}
