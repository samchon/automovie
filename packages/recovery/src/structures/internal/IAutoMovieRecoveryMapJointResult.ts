import type { IAutoMovieRecoveryMapJointFit } from "../image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoveryMapState } from "./IAutoMovieRecoveryMapState";

/**
 * Owned numerical state and explicit fixed-population joint termination.
 *
 * @evidence contracts/development/design.md#principled-representation State accompanies the same-population cost, original-rank and numerical termination report; the coordinator still owns final checkpoint acceptance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named result serves both joint methods without changing the public geometry representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Returned state is not automatically an accepted map, and incomplete methods remain nonconverged.
 * @evidence contracts/development/common.md#meaningful-documentation Defines report ownership and acceptance boundary.
 */
export interface IAutoMovieRecoveryMapJointResult extends IAutoMovieRecoveryMapState {
  /** Actual numerical termination over the same ordered observations. */
  report: IAutoMovieRecoveryMapJointFit;
}
