import type { IAutoMovieRecoverySourceTopology } from "..";

/**
 * Connected dimension-two clipped source cells with independent topology and
 * boundary evidence.
 */
export interface IAutoMovieRecoverySourceComponent {
  /** Index of the component in the query's retained component array. */
  id: number;

  /** Original clipped-cell IDs of this dimension-two component. */
  cells: number[];

  /** Original source triangle IDs supplying the component's cells. */
  faces: number[];

  /** Literal unclassified reconstruction status for this source component. */
  classification: "unclassified";

  /**
   * Combinatorial counts, orientation, manifold links, boundary cycles and
   * possible genus.
   */
  topology: IAutoMovieRecoverySourceTopology;

  /**
   * Simple directed boundary cycles with occurrence order, joining nodes and
   * orientation status.
   */
  cycles: {
    /** Ordered directed occurrence references tracing one component boundary. */
    occurrences: {
      /** ID of the original face-local boundary occurrence. */
      id: string;
      /** Traversal direction against the stored occurrence direction. */
      direction: 1 | -1;
    }[];

    /** Joining node identities encountered around the cycle in order. */
    nodes: string[];

    /**
     * Whether the component's manifold orientation supports this boundary
     * traversal.
     */
    orientation: "coherent" | "unqualified";
  }[];

  /** Boundary occurrence IDs that cannot form simple cycles. */
  unresolvedBoundary: string[];

  /** Indices into the containing result's source issue list. */
  issueIds: number[];
}
