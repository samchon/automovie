import type { IAutoMovieRecoveryFeasibleJointOptions } from "./IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoveryFeasibleReportCapacity } from "./IAutoMovieRecoveryFeasibleReportCapacity";

/**
 * One direct checkpoint's owned method and matching reporting capacity.
 *
 * @evidence contracts/development/design.md#principled-representation Method scalars and their capacity are acquired at the same callback-free boundary, so later caller mutation cannot invalidate the admitted scope.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This direct-only transfer joins one fixed nested snapshot with its context; scene calls already own their method and do not allocate it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No numerical result, caller alias, new method or increased ceiling supplies admission.
 * @evidence contracts/development/common.md#meaningful-documentation Both records have checkpoint lifetime and serve every closure pass without rereading caller options.
 */
export interface IAutoMovieRecoveryCheckpointReporting {
  /** Fixed owned method, including the independent nested direction budget. */
  feasible: IAutoMovieRecoveryFeasibleJointOptions;

  /** Scope derived from that same owned request before any checkpoint callback. */
  reporting: IAutoMovieRecoveryFeasibleReportCapacity;
}
