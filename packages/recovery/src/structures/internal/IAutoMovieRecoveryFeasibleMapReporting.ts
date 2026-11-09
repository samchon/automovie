import type { IAutoMovieRecoveryFeasibleMapWork } from "./IAutoMovieRecoveryFeasibleMapWork";
import type { IAutoMovieRecoveryFeasibleReportCapacity } from "./IAutoMovieRecoveryFeasibleReportCapacity";

/**
 * Admitted numerical work and the borrowed reporting scope for one map fit.
 *
 * @evidence contracts/development/design.md#principled-representation Numerical populations and original work bounds remain separate from fixed report retention.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One fixed record connects original admission to the shared reporting capacity without changing method options.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No numerical result, caller history or raised cap enters admission.
 * @evidence contracts/development/common.md#meaningful-documentation Inherited values keep their original units; reporting is an internal borrowed scope, never returned geometry.
 */
export interface IAutoMovieRecoveryFeasibleMapReporting extends IAutoMovieRecoveryFeasibleMapWork {
  /** Shared admitted capacities; nested owners do not reserve them again. */
  reporting: IAutoMovieRecoveryFeasibleReportCapacity;
}
