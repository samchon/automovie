import type { IAutoMovieRecoverySourceTopology } from "../../index";

/**
 * Edge-connected two-dimensional source cells with independently reported
 * topology. Query-local cell and face lists retain source ownership; topology
 * may be unresolved and classification remains literally unclassified. Boundary
 * cycles retain directed occurrence order.
 */
export interface IAutoMovieRecoverySourceComponent {
  /**
   * Zero-based ordinal in this record's owning cell, component or control
   * registry; it is not a source coordinate.
   */
  id: number;

  /**
   * Observed source cells in query-local index order; source-face addresses
   * remain acquisition metadata.
   */
  cells: number[];

  /**
   * Original source-face indices retained as incidence support; these never
   * become generated mesh indices.
   */
  faces: number[];

  /**
   * Always unclassified: topology observations do not themselves authorize an
   * engine chart.
   */
  classification: "unclassified";

  /**
   * Topology of the relative two-cell sheet; lower-dimensional contacts remain
   * separate evidence.
   */
  topology: IAutoMovieRecoverySourceTopology;

  /**
   * Halfedge occurrence and traversal direction; no coordinate or arbitrary
   * seam closure is added.
   */
  cycles: {
    /**
     * Directed halfedge occurrences retained in actual source-cell traversal
     * order.
     */
    occurrences: {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;
      /**
       * Traversal orientation relative to the stored occurrence: +1 forward and
       * -1 backward.
       */
      direction: 1 | -1;
    }[];

    /**
     * Observed boundary-node identities in traversal order; repeated physical
     * positions retain separate incidence when declared.
     */
    nodes: string[];

    /**
     * Whether traversal follows a qualified coherent sheet orientation or
     * remains explicitly unqualified.
     */
    orientation: "coherent" | "unqualified";
  }[];

  /**
   * Boundary incidence identities whose traversal could not be qualified as a
   * simple cycle.
   */
  unresolvedBoundary: string[];

  /** Indices into the query result's issues array for this component. */
  issueIds: number[];
}
