import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryEventRegionCells } from "./IAutoMovieRecoveryEventRegionCells";
import type { IAutoMovieRecoveryEventRegionSource } from "./IAutoMovieRecoveryEventRegionSource";
import type { IAutoMovieRecoverySourceHalfedge } from "./IAutoMovieRecoverySourceHalfedge";

/**
 * Callable connected-source topology and directed boundary annotation for a
 * clipped query.
 */

export namespace IAutoMovieRecoveryEventRegionTopology {
  /**
   * Join dimension-two clipped cells through source-relative edge incidence.
   * Assign components, orientation and qualified boundary cycles. Return
   * indexed edge and vertex facts for subsequent port attachment.
   */

  export type Operation = (
    _source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
    prepared: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation>,
    work: ReturnType<IAutoMovieRecoveryEventRegionCells.Operation>,
  ) => {
    /** Declared edge incidence keys and their directed source occurrences. */
    edges: Map<string, IAutoMovieRecoverySourceHalfedge[]>;

    /** Directed occurrence population indexed by owning clipped cell ID. */
    cellOccurrences: Map<number, IAutoMovieRecoverySourceHalfedge[]>;

    /** Dimension-two components touching each selected node identity. */
    vertexComponents: Map<string, Set<number>>;

    /** Clipped reference cells touching each selected node identity. */
    vertexCells: Map<string, Set<number>>;

    /** Translate a raw clipping node ID to its prepared incidence key. */
    incidence: (raw: string) => string;
  };
}
