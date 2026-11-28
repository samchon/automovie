import type { AutoMovieRecoverySourceTopologyIssueCode } from "./AutoMovieRecoverySourceTopologyIssueCode";
import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryEventRegionSource } from "./IAutoMovieRecoveryEventRegionSource";
import type { IAutoMovieRecoverySourceCellNode } from "./IAutoMovieRecoverySourceCellNode";

/** Callable creation of clipped source cells and local observation indices. */

export namespace IAutoMovieRecoveryEventRegionCells {
  /**
   * Clip the supplied complete candidate overlap population against both closed
   * scalar planes. Retain reference-domain dimension and original physical rank
   * independently. Return per-cell and face lookup tables plus an issue
   * collector.
   */

  export type Operation = (
    source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
    prepared: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation>,
    query: Parameters<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>[0],
  ) => {
    /**
     * Mutable per-query result populated by subsequent topology and port
     * stages.
     */
    result: ReturnType<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>;

    /** Admitted finite lower scalar level in millimetres. */
    lower: number;

    /** Admitted finite upper scalar level in millimetres. */
    upper: number;

    /** Lookup from raw clipped node ID to its original node record. */
    nodeMap: Map<string, IAutoMovieRecoverySourceCellNode>;

    /** Ordered raw clipped polygon nodes by result cell ID. */
    cellNodes: Map<number, IAutoMovieRecoverySourceCellNode[]>;

    /** Original source face ordinal to its retained clipped-cell ID. */
    faceCells: Map<number, number>;

    /**
     * Attach a classified issue to the current cell result and return its issue
     * index.
     */
    issue: (
      code: AutoMovieRecoverySourceTopologyIssueCode,
      cells: number[],
      occurrences?: string[],
      ports?: string[],
    ) => number;
  };
}
