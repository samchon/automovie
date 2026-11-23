import type {
  IAutoMovieRecoveryEndpointControlOwner,
  IAutoMovieRecoveryEventDomainCompilation,
} from "../../index";

/**
 * Successful chart compilation retaining complete native parents and endpoint
 * owners.
 */
export interface IAutoMovieRecoveryNativeChartCompilation extends IAutoMovieRecoveryEventDomainCompilation {
  /** Declared endpoint names bound to compacted recipe control indices. */
  endpointControlOwners: IAutoMovieRecoveryEndpointControlOwner[];

  /** Existing complete-parent and local partial-interval representation. */
  representation: "native-parent-local-partial-bindings-v1";

  /** Final U direction after applying the input winding. */
  chartDirectionU: 1 | -1;
}
