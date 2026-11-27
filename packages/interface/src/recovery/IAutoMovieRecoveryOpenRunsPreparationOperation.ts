import type {
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryOpenContinuation,
} from "..";
import type { IAutoMovieRecoveryOpenContinuationEdge } from "./IAutoMovieRecoveryOpenContinuationEdge";

/** Admit saved open continuation and prepare one-to-one ordinary run ownership. */

export namespace IAutoMovieRecoveryOpenRunsPreparationOperation {
  /**
   * Admit saved open continuation and prepare one-to-one ordinary run
   * ownership.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryMeshSections,
    graph: IAutoMovieRecoveryOpenContinuation,
    operator: "quadratic" | "ruled",
  ) => {
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
