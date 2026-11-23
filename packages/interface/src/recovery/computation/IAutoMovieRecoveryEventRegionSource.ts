import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";

/** Prepare immutable source rank and incidence once for all scalar queries. */

export namespace IAutoMovieRecoveryEventRegionSource {
  /** Prepare immutable source rank and incidence once for all scalar queries. */

  export type Operation = (
    source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
  ) => {
    /**
     * Returns the current registry population without mutating the retained
     * observation state.
     */
    size: number;

    /** Exact affine rank (0, 1 or 2) of each original binary64 source triangle. */
    ranks: Uint8Array;

    /** Original face ordinals participating in repeated declared face incidence. */
    duplicate: Set<number>;

    /**
     * Original face ordinals whose selected incidence identifies fewer than
     * three distinct vertices.
     */
    collapsed: Set<number>;

    /**
     * Original source-edge incidence registry reused for cell and boundary
     * qualification.
     */
    sourceEdges: Map<string, number>;

    /**
     * Maps one original vertex index to the selected raw or canonical
     * connectivity index.
     */
    address: (vertex: number) => number;

    /**
     * Canonical deterministic key for an undirected pair of incidence
     * identities.
     */
    pair: (a: number, b: number) => string;
  };
}
