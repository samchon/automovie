import type { AutoMovieRecoverySourceTopologyIssueCode } from "../../index";

/**
 * Source-topology or port-membership failure with its exact supporting
 * incidences. The closed issue code is accompanied by original face ordinals,
 * query-local cells and directed occurrence/port identities. Empty support
 * arrays are permitted when that category has no such witness.
 */
export interface IAutoMovieRecoverySourceTopologyIssue {
  /**
   * Diagnostic category produced by the topology observer; it carries no
   * automatic repair instruction.
   */
  code: AutoMovieRecoverySourceTopologyIssueCode;

  /**
   * Original source-face indices retained as incidence support; these never
   * become generated mesh indices.
   */
  faces: number[];

  /**
   * Observed source cells in query-local index order; source-face addresses
   * remain acquisition metadata.
   */
  cells: number[];

  /**
   * Directed halfedge occurrences retained in actual source-cell traversal
   * order.
   */
  occurrences: string[];

  /**
   * Declared boundary observations and their component membership; ambiguous or
   * missing membership remains explicit.
   */
  ports: string[];
}
