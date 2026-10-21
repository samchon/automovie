import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryFeasibleJointOptions } from "./IAutoMovieRecoveryFeasibleJointOptions";

/**
 * Fixed owned scene method state, excluding the existing cumulative work ledger.
 *
 * @evidence contracts/common.md#principled-implementation Declared and execution budgets distinguish the original reported ceiling from numerical capacity after the routing reservation.
 * @evidence contracts/common.md#clear-and-simple-design Three references group two fixed budget records and one nested scalar method snapshot; the scene retains its existing geometry and work owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller option alias, numerical answer, image identity or changed geometric threshold enters the route.
 * @evidence contracts/common.md#meaningful-documentation Each member states ownership and the different lifetime of reporting and execution values.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The two17-field budgets, eight option/reference fields and three routing references occupy45 fixed slots; the declared budget transfers into the result and other references expire synchronously.
 */
export interface IAutoMovieRecoverySceneFeasibleRouting {
  /** Owned original ceilings, transferred directly to the returned result. */
  declared: IAutoMovieRecoveryCameraSceneBudget;

  /** Owned unchanged ceilings except the64-slot routing reservation. */
  execution: IAutoMovieRecoveryCameraSceneBudget;

  /** Owned nested scalar options, with fit retention capped by execution capacity. */
  feasible: IAutoMovieRecoveryFeasibleJointOptions;
}
