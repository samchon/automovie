import type {
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryOpenContinuation,
} from "../../index";

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
    outgoing: Map<string, IAutoMovieRecoveryOpenRunsPreparationOperation.Edge>;

    /** Saved open-arc identity to its unique incoming continuation edge; branching remains unsupported. */
    incoming: Map<string, IAutoMovieRecoveryOpenRunsPreparationOperation.Edge>;

    /** Admitted saved-section pair records or their counted population, preserving the caller's pair order. */
    pairs: number;

    /** Observed continuation components that cannot authorize a supported surface bridge. */
    unsupportedGroups: number;

    /** Unsupported continuation groups containing at least one saved open arc. */
    unsupportedGroupsWithOpenArcs: number;
  };

  /**
   * Edge within recovery open runs preparation operation. Original before-side boundary observations or their source-face support, retaining the supplied side order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Original before-side boundary observations or their source-face support, retaining the supplied side order. Original after-side boundary observations or their source-face support, retaining the supplied side order.
   * @evidence contracts/development/design.md#principled-representation Ordinal of the caller-supplied saved-section pair that produced this graph edge.
   * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryOpenRuns share IAutoMovieRecoveryOpenRunsPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type Edge = {
    /** Original before-side boundary observations or their source-face support, retaining the supplied side order. */
    before: IAutoMovieRecoveryOpenRunsPreparationOperation.Node;

    /** Original after-side boundary observations or their source-face support, retaining the supplied side order. */
    after: IAutoMovieRecoveryOpenRunsPreparationOperation.Node;

    /** Whether the matched continuation reverses the after-curve's saved order. */
    reverse: boolean;

    /** Ordinal of the caller-supplied saved-section pair that produced this graph edge. */
    pairOrdinal: number;
  };

  /**
   * Node within recovery open runs preparation operation. Its referenced contract retains the same units, ordering and absence semantics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Admit saved open continuation and prepare one-to-one ordinary run ownership.
   * @evidence contracts/development/design.md#principled-representation Admit saved open continuation and prepare one-to-one ordinary run ownership.
   * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryOpenRuns share IAutoMovieRecoveryOpenRunsPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type Node = {
    /** Saved-section ordinal in the input observation sequence. */
    section: number;
    /** Open-arc ordinal in the addressed saved section's report. */
    arc: number;
  };
}
