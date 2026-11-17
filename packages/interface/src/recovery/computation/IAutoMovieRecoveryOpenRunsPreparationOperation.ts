import type {
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryOpenContinuation,
} from "../../index";
import type { IAutoMovieRecoveryOpenContinuationEdge } from "./IAutoMovieRecoveryOpenContinuationEdge";

/**
 * Admit saved open continuation and prepare one-to-one ordinary run ownership.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Saved open-arc identity to its unique outgoing continuation edge; branching remains unsupported. Saved open-arc identity to its unique incoming continuation edge; branching remains unsupported.
 * @evidence contracts/development/design.md#principled-representation Ordinal of the caller-supplied saved-section pair that produced this graph edge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryOpenRuns share IAutoMovieRecoveryOpenRunsPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Saved open-arc identity to its unique outgoing continuation edge; branching remains unsupported.
 */

export namespace IAutoMovieRecoveryOpenRunsPreparationOperation {
  /**
   * Admit saved open continuation and prepare one-to-one ordinary run ownership.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Saved open-arc identity to its unique outgoing continuation edge; branching remains unsupported. Saved open-arc identity to its unique incoming continuation edge; branching remains unsupported.
   * @evidence contracts/development/design.md#principled-representation Admit saved open continuation and prepare one-to-one ordinary run ownership.
   * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryOpenRuns share IAutoMovieRecoveryOpenRunsPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Saved open-arc identity to its unique outgoing continuation edge; branching remains unsupported.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryMeshSections,
    graph: IAutoMovieRecoveryOpenContinuation,
    operator: "quadratic" | "ruled",
  ) => {
    /** Saved open-arc identity to its unique outgoing continuation edge; branching remains unsupported. */
    outgoing: Map<string, IAutoMovieRecoveryOpenContinuationEdge>;

    /** Saved open-arc identity to its unique incoming continuation edge; branching remains unsupported. */
    incoming: Map<string, IAutoMovieRecoveryOpenContinuationEdge>;

    /** Admitted saved-section pair records or their counted population, preserving the caller's pair order. */
    pairs: number;

    /** Observed continuation components that cannot authorize a supported surface bridge. */
    unsupportedGroups: number;

    /** Unsupported continuation groups containing at least one saved open arc. */
    unsupportedGroupsWithOpenArcs: number;
  };
}
