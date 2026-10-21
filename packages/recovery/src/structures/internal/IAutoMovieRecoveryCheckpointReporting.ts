import type { IAutoMovieRecoveryFeasibleJointOptions } from "./IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoveryFeasibleReportCapacity } from "./IAutoMovieRecoveryFeasibleReportCapacity";

/**
 * One direct checkpoint's owned method and matching reporting capacity.
 *
 * @evidence contracts/common.md#principled-implementation Method scalars and their capacity are acquired at the same callback-free boundary, so later caller mutation cannot invalidate the admitted scope.
 * @evidence contracts/common.md#clear-and-simple-design This direct-only transfer joins one fixed nested snapshot with its context; scene calls already own their method and do not allocate it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No numerical result, caller alias, new method or increased ceiling supplies admission.
 * @evidence contracts/common.md#meaningful-documentation Both records have checkpoint lifetime and serve every closure pass without rereading caller options.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased transfer performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two references plus identity occupy three logical slots; the eight snapshot properties and two object identities fit the same current512 reporting envelope.
 */
export interface IAutoMovieRecoveryCheckpointReporting {
  /** Fixed owned method, including the independent nested direction budget. */
  feasible: IAutoMovieRecoveryFeasibleJointOptions;

  /** Scope derived from that same owned request before any checkpoint callback. */
  reporting: IAutoMovieRecoveryFeasibleReportCapacity;
}
