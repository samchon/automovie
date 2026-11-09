import type { IAutoMovieRecoveryEndpointControlOwner } from "./IAutoMovieRecoveryEndpointControlOwner";
import type { IAutoMovieRecoveryEventDomainCompilation } from "./IAutoMovieRecoveryEventDomainCompilation";

/**
 * Successful chart compilation retaining complete native parents and endpoint owners.
 *
 * @evidence contracts/development/design.md#principled-representation The inherited complete discriminant and explicit native bindings preserve the compiler's successful result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named success record is independent of the separate patch-budget refusal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration adds no acceptance or fallback branch.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify endpoint indices, the existing representation literal and final chart direction.
 */
export interface IAutoMovieRecoveryNativeChartCompilation extends IAutoMovieRecoveryEventDomainCompilation {
  /** Declared endpoint names bound to compacted recipe control indices. */
  endpointControlOwners: IAutoMovieRecoveryEndpointControlOwner[];

  /** Existing complete-parent and local partial-interval representation. */
  representation: "native-parent-local-partial-bindings-v1";

  /** Final U direction after applying the input winding. */
  chartDirectionU: 1 | -1;
}
