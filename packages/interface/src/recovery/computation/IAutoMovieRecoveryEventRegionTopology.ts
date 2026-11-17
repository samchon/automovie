import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryEventRegionCells } from "./IAutoMovieRecoveryEventRegionCells";
import type { IAutoMovieRecoveryEventRegionSource } from "./IAutoMovieRecoveryEventRegionSource";
import type { IAutoMovieRecoverySourceHalfedge } from "./IAutoMovieRecoverySourceHalfedge";

/**
 * Observe component incidence, orientation parity, links and boundary cycles in one query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Undirected edge-incidence registry with the actual incident faces or master-control bindings. Cell ordinal to its directed halfedge occurrences; occurrences retain source-face ownership.
 * @evidence contracts/development/design.md#principled-representation Cell ordinal to its directed halfedge occurrences; occurrences retain source-face ownership.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegion, RecoveryEventRegionPorts, RecoveryEventRegionTopology share IAutoMovieRecoveryEventRegionTopology's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Undirected edge-incidence registry with the actual incident faces or master-control bindings.
 */

export namespace IAutoMovieRecoveryEventRegionTopology {
  /**
   * Observe component incidence, orientation parity, links and boundary cycles in one query.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Undirected edge-incidence registry with the actual incident faces or master-control bindings. Cell ordinal to its directed halfedge occurrences; occurrences retain source-face ownership.
   * @evidence contracts/development/design.md#principled-representation Cell ordinal to its directed halfedge occurrences; occurrences retain source-face ownership.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegion, RecoveryEventRegionPorts, RecoveryEventRegionTopology share IAutoMovieRecoveryEventRegionTopology's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Undirected edge-incidence registry with the actual incident faces or master-control bindings.
   */

  export type Operation = (
    _source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
    prepared: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation>,
    work: ReturnType<IAutoMovieRecoveryEventRegionCells.Operation>,
  ) => {
    /** Undirected edge-incidence registry with the actual incident faces or master-control bindings. */
    edges: Map<string, IAutoMovieRecoverySourceHalfedge[]>;

    /** Cell ordinal to its directed halfedge occurrences; occurrences retain source-face ownership. */
    cellOccurrences: Map<number, IAutoMovieRecoverySourceHalfedge[]>;

    /** Declared vertex incidence to the set of incident two-cell component ordinals. */
    vertexComponents: Map<string, Set<number>>;

    /** Declared vertex incidence to the set of incident cell ordinals. */
    vertexCells: Map<string, Set<number>>;

    /** Selects raw source addresses or caller-declared canonical connectivity; equal coordinates alone do not select an equivalence. */
    incidence: (raw: string) => string;
  };
}
