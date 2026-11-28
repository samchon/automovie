import type {
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoverySourceTerminal,
} from "..";

/**
 * Callable source terminal observation from physically registered closed-loop
 * seeds.
 */

export namespace IAutoMovieRecoverySourceTerminalsObservationOperation {
  /**
   * Trace original face support toward increasing scalar heights from each
   * closed-loop seed. Return source maxima, critical witnesses and available
   * event brackets. Optional checkpoints run synchronously.
   */

  export type Operation = (input: {
    /**
     * Prepared registered source, canonical addresses and original face support
     * maps.
     */
    prepared: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>;

    /** Signed scalar heights for original source vertices in millimetres. */
    heights: readonly number[];

    /** Unit cutting normal defining the positive traversal direction. */
    axis: [number, number, number];

    /** Closed-loop seeds with their original source-face support. */
    seeds: readonly {
      /** Original signed physical station of this seed in millimetres. */
      coordinateMm: number;

      /** Published closed-loop index in the seed's saved section. */
      loopIndex: number;

      /** Name of the selected saved closed cubic curve. */
      curveName: string;

      /** Original triangles supporting the selected closed source loop. */
      faces: ReadonlySet<number>;
    }[];

    /** Optional synchronous checkpoint invoked before observing a seed. */
    checkpoint?: () => void;
  }) => IAutoMovieRecoverySourceTerminal[];
}
