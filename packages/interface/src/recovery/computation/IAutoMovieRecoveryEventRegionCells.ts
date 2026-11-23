import type { AutoMovieRecoverySourceTopologyIssueCode } from "./AutoMovieRecoverySourceTopologyIssueCode";
import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryEventRegionSource } from "./IAutoMovieRecoveryEventRegionSource";
import type { IAutoMovieRecoverySourceCellNode } from "./IAutoMovieRecoverySourceCellNode";

/** Clip one ordered candidate population into fresh private query cells. */

export namespace IAutoMovieRecoveryEventRegionCells {
  /** Clip one ordered candidate population into fresh private query cells. */

  export type Operation = (
    source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
    prepared: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation>,
    query: Parameters<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>[0],
  ) => {
    /**
     * Query-local result under construction, shared by cell, topology and port
     * observation phases.
     */
    result: ReturnType<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>;

    /**
     * Lower scalar-boundary node registry for this query, with original source
     * incidence preserved.
     */
    lower: number;

    /**
     * Upper scalar-boundary node registry for this query, with original source
     * incidence preserved.
     */
    upper: number;

    /**
     * Observed node identity to the one query-local node record that owns its
     * scalar value.
     */
    nodeMap: Map<string, IAutoMovieRecoverySourceCellNode>;

    /**
     * Cell ordinal to its observed boundary-node sequence in the current scalar
     * query.
     */
    cellNodes: Map<number, IAutoMovieRecoverySourceCellNode[]>;

    /**
     * Original source-face ordinal to its cell ordinal in the current scalar
     * query.
     */
    faceCells: Map<number, number>;

    /**
     * Appends one query-local topology issue and returns its index; optional
     * occurrence/port lists default to empty.
     */
    issue: (
      code: AutoMovieRecoverySourceTopologyIssueCode,
      cells: number[],
      occurrences?: string[],
      ports?: string[],
    ) => number;
  };
}
