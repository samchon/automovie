import type { IAutoMovieRecoveryFeasibleMapWork } from "./IAutoMovieRecoveryFeasibleMapWork";
import type { IAutoMovieRecoveryFeasibleReportCapacity } from "./IAutoMovieRecoveryFeasibleReportCapacity";

/**
 * Admitted numerical work and the borrowed reporting scope for one map fit.
 *
 * @evidence contracts/common.md#principled-implementation Numerical populations and original work bounds remain separate from fixed report retention.
 * @evidence contracts/common.md#clear-and-simple-design One fixed record connects original admission to the shared reporting capacity without changing method options.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No numerical result, caller history or raised cap enters admission.
 * @evidence contracts/common.md#meaningful-documentation Inherited values keep their original units; reporting is an internal borrowed scope, never returned geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Eight existing scalars and one context reference expire with this fit and fit the fixed current reporting envelope.
 */
export interface IAutoMovieRecoveryFeasibleMapReporting extends IAutoMovieRecoveryFeasibleMapWork {
  /** Shared admitted capacities; nested owners do not reserve them again. */
  reporting: IAutoMovieRecoveryFeasibleReportCapacity;
}
