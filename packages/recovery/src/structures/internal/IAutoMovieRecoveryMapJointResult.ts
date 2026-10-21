import type { IAutoMovieRecoveryMapJointFit } from "../image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoveryMapState } from "./IAutoMovieRecoveryMapState";

/**
 * Owned numerical state and explicit fixed-population joint termination.
 *
 * @evidence contracts/common.md#principled-implementation State accompanies the same-population cost, original-rank and numerical termination report; the coordinator still owns final checkpoint acceptance.
 * @evidence contracts/common.md#clear-and-simple-design One named result serves both joint methods without changing the public geometry representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Returned state is not automatically an accepted map, and incomplete methods remain nonconverged.
 * @evidence contracts/common.md#meaningful-documentation Defines report ownership and acceptance boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result performs no fit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned state and plain diagnostics transfer without factors, callbacks or external resources.
 */
export interface IAutoMovieRecoveryMapJointResult extends IAutoMovieRecoveryMapState {
  /** Actual numerical termination over the same ordered observations. */
  report: IAutoMovieRecoveryMapJointFit;
}
