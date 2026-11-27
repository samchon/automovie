import type { IAutoMovieConvexSupportLoftSpan } from "@automovie/interface";

/*
 * Call-local algebraic partition of a convex support loft. The plan borrows the
 * original metre fields and dimensionless normals until emission ends.
 */
export interface IAutoMovieSupportLoftPlan64 {
  /*
   * Support normals in registry order.
   */
  normals: readonly (readonly [number, number])[];

  /*
   * Polynomial fields and their feasible event partitions in station order.
   */
  spans: IAutoMovieSupportLoftPlan64.ISpan[];

  /*
   * Feasible interior event stations, excluding endpoints.
   */
  events: number;

  /*
   * Ruled-face interpolation bound in metres within the event partition.
   */
  tolerance: number;
}

/*
 * Construction records owned by one support-loft plan.
 */
export namespace IAutoMovieSupportLoftPlan64 {
  /*
   * Plan for a single cubic support field and its bounded station interval.
   */
  export interface ISpan {
    /*
     * Authored station interval and support offset coefficients in metres.
     */
    field: IAutoMovieConvexSupportLoftSpan;

    /*
     * Cubic intersections keyed by ascending plane ordinals as `i:j`.
     */
    curves: Map<string, ICurve>;

    /*
     * Feasible stations in ascending normalized phase, including 0 and 1.
     */
    stations: IStation[];

    /*
     * Plane triples whose determinant vanishes over the full cubic span.
     */
    continuities: [number, number, number][];

    /*
     * Admitted open intervals between each pair of adjacent stations.
     */
    intervals: IInterval[];
  }

  /*
   * Boundary curve where two fixed-normal planes intersect across the span.
   */
  export interface ICurve {
    /*
     * Ascending support-plane registry ordinals.
     */
    pair: [number, number];

    /*
     * Signed determinant of the two dimensionless unit XZ normal rows.
     */
    determinant: number;

    /*
     * Four cubic Bernstein X coefficients in metres, over local phase [0, 1].
     */
    x: number[];

    /*
     * Four cubic Bernstein Z coefficients in metres, over local phase [0, 1].
     */
    z: number[];
  }

  /*
   * A span endpoint or a feasible interior event with coincident planes.
   */
  export interface IStation {
    /*
     * Local span phase in [0, 1]. Merged roots satisfy all incident planes.
     */
    phase: number;

    /*
     * Ascending plane ordinal triples incident here, possibly empty at ends.
     */
    triples: [number, number, number][];
  }

  /*
   * Adjacent station ordinals and their active polygon subdivision.
   */
  export interface IInterval {
    /*
     * Lower zero-based station ordinal.
     */
    before: number;

    /*
     * Upper station ordinal, equal to before + 1.
     */
    after: number;

    /*
     * Boundary curve keys in cyclic vertex order.
     */
    pairs: string[];

    /*
     * Supporting plane ordinal for each edge from a pair to its successor.
     */
    faces: number[];

    /*
     * Axial subdivisions required by the endpoint-curve chord bound.
     */
    segments: number;
  }
}
