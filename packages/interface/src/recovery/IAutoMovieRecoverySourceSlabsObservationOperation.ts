import type {
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoveryScalarIndex,
  IAutoMovieRecoverySlabObservation,
  IAutoMovieRecoverySlabPair,
  IAutoMovieRecoverySourceLineage,
} from "..";

/**
 * Bind actual cut-emitting faces and published contour identities to clipped
 * source slabs. The same physical scalar chart drives source cells and PL
 * critical classification. All components and issues survive; only actual
 * segment/contact provenance supplies ports, never endpoint-star witnesses.
 * Copy the observed raw-node, alias and halfedge registries with their input
 * ordinal spaces so boundary words remain joinable without parsing IDs.
 * Measured critical brackets do not imply curves fitted at those bracket
 * planes, exact material phase transport or transverse jets.
 */

export namespace IAutoMovieRecoverySourceSlabsObservationOperation {
  /**
   * Bind actual cut-emitting faces and published contour identities to clipped
   * source slabs. The same physical scalar chart drives source cells and PL
   * critical classification. All components and issues survive; only actual
   * segment/contact provenance supplies ports, never endpoint-star witnesses.
   * Copy the observed raw-node, alias and halfedge registries with their input
   * ordinal spaces so boundary words remain joinable without parsing IDs.
   * Measured critical brackets do not imply curves fitted at those bracket
   * planes, exact material phase transport or transverse jets.
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
     * Whether registration explicitly authorizes exact-coordinate alias
     * grouping; no distance tolerance is used.
     */
    exactCoordinateAliases: boolean;

    /**
     * Prepared immutable scalar face-interval index reused by all selected
     * plane or slab queries.
     */
    index: ReturnType<IAutoMovieRecoveryScalarIndex.Create>;

    /**
     * Admitted saved-section pair records or their counted population,
     * preserving the caller's pair order.
     */
    pairs: readonly IAutoMovieRecoverySlabPair[];

    /**
     * Complete saved-plane coordinates in registered millimetres, in
     * publication order.
     */
    sectionCoordinatesMm: readonly number[];

    /**
     * Complete original contour-publication lineage used to bind ports without
     * inventing a fitted curve.
     */
    publications: readonly IAutoMovieRecoverySourceLineage[];

    /**
     * Synchronous cooperative cancellation/work checkpoint; a thrown exception
     * aborts the current operation.
     */
    checkpoint?: () => void;

    /**
     * Synchronous observation callback; caller-owned work and retained copies
     * are outside the numerical operation's resource bound.
     */
    observe?: (record: IAutoMovieRecoverySlabObservation) => void;
  }) => IAutoMovieRecoverySlabObservation[];
}
