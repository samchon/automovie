import type { AutoMovieRecoverySourceTopologyIssueCode } from "..";

/**
 * Observed source topology or port-binding problem and its original incidence
 * witnesses.
 */
export interface IAutoMovieRecoverySourceTopologyIssue {
  /** Named source incidence, winding, geometry or port-binding issue category. */
  code: AutoMovieRecoverySourceTopologyIssueCode;

  /** Distinct original source triangle ordinals associated with this issue. */
  faces: number[];

  /** Distinct clipped-cell IDs affected by the issue. */
  cells: number[];

  /** Affected directed boundary occurrence IDs when available. */
  occurrences: string[];

  /** Named affected port IDs when available. */
  ports: string[];
}
