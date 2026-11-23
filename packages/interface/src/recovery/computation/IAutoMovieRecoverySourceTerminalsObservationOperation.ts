import type {
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoverySourceTerminal,
} from "../../index";

/**
 * Observe actual distal extrema and PL critical brackets from existing
 * source-loop incidence. The open half-space is bounded above by the next
 * representable value beyond the source maximum. Private vertex-face probes let
 * the existing slab graph identify exactly the seeded indexed-source component;
 * original point positions are published only as measured extrema and critical
 * event observations. A one-tip result requires unique incidence, two-use
 * original edges, one nonflat manifold maximum and no other critical event;
 * branch and plateau observations remain explicit.
 */

export namespace IAutoMovieRecoverySourceTerminalsObservationOperation {
  /**
   * Observe actual distal extrema and PL critical brackets from existing
   * source-loop incidence. The open half-space is bounded above by the next
   * representable value beyond the source maximum. Private vertex-face probes
   * let the existing slab graph identify exactly the seeded indexed-source
   * component; original point positions are published only as measured extrema
   * and critical event observations. A one-tip result requires unique
   * incidence, two-use original edges, one nonflat manifold maximum and no
   * other critical event; branch and plateau observations remain explicit.
   */

  export type Operation = (input: {
    /**
     * Source incidence or chart preparation shared by the operation; its
     * borrowed arrays remain stable for the pass.
     */
    prepared: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>;

    /**
     * Finite scalar projections aligned with source vertices, in the same units
     * as query levels.
     */
    heights: readonly number[];

    /**
     * Registered unit sweep axis; its direction fixes signed section
     * coordinates.
     */
    axis: [number, number, number];

    /**
     * Saved terminal-loop observations with their original plane and exact
     * source-face support.
     */
    seeds: readonly {
      /**
       * Signed section-plane coordinate along the registered unit sweep axis,
       * in millimetres.
       */
      coordinateMm: number;

      /** Closed-loop ordinal within the saved section's admitted loop array. */
      loopIndex: number;

      /**
       * Stable saved coefficient identity, retained without inferring
       * anatomical or material correspondence.
       */
      curveName: string;

      /**
       * Original source-face indices retained as incidence support; these never
       * become generated mesh indices.
       */
      faces: ReadonlySet<number>;
    }[];

    /**
     * Synchronous cooperative cancellation/work checkpoint; a thrown exception
     * aborts the current operation.
     */
    checkpoint?: () => void;
  }) => IAutoMovieRecoverySourceTerminal[];
}
