import type {
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoveryScalarIndex,
  IAutoMovieRecoverySlabObservation,
  IAutoMovieRecoverySlabPair,
  IAutoMovieRecoverySourceLineage,
} from "..";

/** Callable source observation of requested physical slabs between known cuts. */

export namespace IAutoMovieRecoverySourceSlabsObservationOperation {
  /**
   * Observe requested source slabs using prepared source incidence, finite
   * physical heights and prior exact cut publications. Report clipped
   * components, cut-port status and critical observations. Checkpoint and
   * observation hooks run synchronously.
   */

  export type Operation = (input: {
    /**
     * Prepared original source mesh, canonical incidence and supporting face
     * indices.
     */
    prepared: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>;

    /** Finite original-vertex heights in registered millimetres. */
    heights: readonly number[];

    /** Unit cutting normal defining the scalar coordinates. */
    axis: [number, number, number];

    /**
     * Whether exact-coordinate aliases own the clipped region's incidence
     * identities.
     */
    exactCoordinateAliases: boolean;

    /**
     * Scalar source index shared by the interval and its individual boundary
     * cuts.
     */
    index: ReturnType<IAutoMovieRecoveryScalarIndex.Create>;

    /** Requested increasing millimetre bounds in caller pair order. */
    pairs: readonly IAutoMovieRecoverySlabPair[];

    /** Physical stations available as observed cut addresses. */
    sectionCoordinatesMm: readonly number[];

    /**
     * Contour publications with original exact cut-emitting triangle addresses
     * at each endpoint.
     */
    publications: readonly IAutoMovieRecoverySourceLineage[];

    /** Optional synchronous check called before a slab is observed. */
    checkpoint?: () => void;

    /** Optional synchronous observer called with the completed slab record. */
    observe?: (record: IAutoMovieRecoverySlabObservation) => void;
  }) => IAutoMovieRecoverySlabObservation[];
}
