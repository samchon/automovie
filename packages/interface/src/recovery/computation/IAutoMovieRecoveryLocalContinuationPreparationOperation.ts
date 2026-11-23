import type {
  IAutoMovieRecoveryAnalyticDomainsRealizationOperation,
  IAutoMovieRecoveryOpenContinuation,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "../../index";
import type { IAutoMovieRecoveryOpenArcAddress } from "./IAutoMovieRecoveryOpenArcAddress";
import type { IAutoMovieRecoveryOpenContinuationEdge } from "./IAutoMovieRecoveryOpenContinuationEdge";

/**
 * Prepare immutable saved open-arc continuation maps before local surface
 * emission.
 */

export namespace IAutoMovieRecoveryLocalContinuationPreparationOperation {
  /**
   * Prepare immutable saved open-arc continuation maps before local surface
   * emission.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryTensorFamiliesInput,
    graph: IAutoMovieRecoveryOpenContinuation,
    analytic: ReturnType<IAutoMovieRecoveryAnalyticDomainsRealizationOperation.Operation>,
  ) => {
    /**
     * Stable incidence identity used for deterministic registry lookup;
     * matching text does not imply coordinate equality.
     */
    key: (n: IAutoMovieRecoveryOpenArcAddress) => string;

    /**
     * Saved open-arc identity to its unique outgoing continuation edge;
     * branching remains unsupported.
     */
    outgoing: Map<string, IAutoMovieRecoveryOpenContinuationEdge>;

    /**
     * Saved open-arc identity to its unique incoming continuation edge;
     * branching remains unsupported.
     */
    incoming: Map<string, IAutoMovieRecoveryOpenContinuationEdge>;

    /**
     * Admitted saved-section pair records or their counted population,
     * preserving the caller's pair order.
     */
    pairs: number;

    /**
     * Observed continuation components that cannot authorize a supported
     * surface bridge.
     */
    unsupportedGroups: number;

    /** Unsupported continuation groups containing at least one saved open arc. */
    unsupportedGroupsWithOpenArcs: number;
  };
}
