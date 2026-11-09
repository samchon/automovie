import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface";

import type { IAutoMovieRecoveryFeasibleJointOptions } from "./IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoveryFeasibleReportCapacity } from "./IAutoMovieRecoveryFeasibleReportCapacity";

/**
 * Fixed owned scene method state, excluding the existing cumulative work ledger.
 *
 * @evidence contracts/development/design.md#principled-representation Declared and execution budgets distinguish the original reported ceiling from numerical capacity after the routing reservation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three initial references group two fixed budget records and one nested scalar method snapshot; a later reporting context is acquired only inside the seed try. The scene retains its existing geometry and work owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caller option alias, numerical answer, image identity or changed geometric threshold enters the route.
 * @evidence contracts/development/common.md#meaningful-documentation Each member states ownership and the different lifetime of reporting and execution values.
 */
export interface IAutoMovieRecoverySceneFeasibleRouting {
  /** Owned original ceilings, transferred directly to the returned result. */
  declared: IAutoMovieRecoveryCameraSceneBudget;

  /** Owned execution ceilings after routing and, once acquired, reporting retention. */
  execution: IAutoMovieRecoveryCameraSceneBudget;

  /** Owned nested scalar options, with fit retention capped by execution capacity. */
  feasible: IAutoMovieRecoveryFeasibleJointOptions;

  /** Acquired only after relative-seed acceptance, inside the seed transaction try. */
  reporting?: IAutoMovieRecoveryFeasibleReportCapacity;
}
