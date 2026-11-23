import type { IAutoMovieConvexSupportLoft } from "../model/IAutoMovieConvexSupportLoft";

/**
 * Call-local algebraic plan for a convex support section family. Curves retain
 * complete cubic XZ coefficients in metres and registry plane-pair identities,
 * with their fixed normal determinant. Event incidence joins their physical
 * endpoints; no coordinate welding or sampled source data supplies that
 * relationship.
 */
export interface IAutoMovieSupportLoftPlan64 {
  /** Borrowed immutable-for-call support normals in registry order. */
  normals: readonly (readonly [number, number])[];

  /** Ordered polynomial fields and their actual algebraic event partitions. */
  spans: {
    /**
     * Borrowed original support-field span, including its physical station
     * interval and every cubic offset coefficient in metres.
     */
    field: IAutoMovieConvexSupportLoft["spans"][number];
    /**
     * Plane-pair key i:j to complete cubic XZ intersection coefficients; pairs
     * below minimumDirectionSine are omitted from this registry.
     */
    curves: Map<
      string,
      {
        /**
         * Two ascending zero-based plane registry ordinals whose support
         * equations define this boundary curve.
         */
        pair: [number, number];
        /**
         * Signed determinant of the two unit XZ normal rows; dimensionless and
         * fixed throughout the polynomial span.
         */
        determinant: number;
        /**
         * Four cubic Bernstein X-coordinate coefficients in metres over
         * normalized local span phase [0,1].
         */
        x: number[];
        /**
         * Four cubic Bernstein Z-coordinate coefficients in metres over the
         * same local span phase.
         */
        z: number[];
      }
    >;
    /**
     * Ordered normalized event phases including 0 and 1, with all feasible
     * triple-plane incidences assigned to each numerical station.
     */
    stations: {
      /**
       * Normalized local span coordinate in [0,1]; nearby numerical roots share
       * a station only after their plane equations pass the same feasibility
       * bound.
       */
      phase: number;
      /**
       * Ascending triples of plane registry ordinals incident at this station;
       * endpoints initially have an empty list and may acquire event
       * incidences.
       */
      triples: [number, number, number][];
    }[];
    /**
     * Plane-index triples whose entire cubic determinant vanishes, representing
     * continuous incidence rather than isolated event roots.
     */
    continuities: [number, number, number][];
    /**
     * Admitted open intervals between adjacent station entries, each with one
     * ordered active polygon and planned face subdivisions.
     */
    intervals: {
      /**
       * Zero-based index of the lower endpoint in this span's stations array,
       * not a physical station coordinate.
       */
      before: number;
      /** Zero-based index of the next station entry, equal to before + 1. */
      after: number;
      /**
       * Boundary-curve keys in the admitted section polygon's cyclic vertex
       * order.
       */
      pairs: string[];
      /**
       * Plane ordinal supporting each edge from pairs[i] to its cyclic
       * successor; aligned with pairs.
       */
      faces: number[];
      /**
       * Positive subdivision count from the endpoint-curve second-derivative
       * chord bound; pairs.length times this count consumes the cell budget.
       */
      segments: number;
    }[];
  }[];

  /** Feasible interior event stations, independently of emitted mesh size. */
  events: number;

  /**
   * Requested ruled-face interpolation bound in metres, conditional on the
   * numerical event partition.
   */
  tolerance: number;
}
