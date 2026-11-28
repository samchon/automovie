import type { IAutoMovieSupportSectionVertex } from "./IAutoMovieSupportSectionVertex";

/** Preparation and reuse of fixed-direction convex section intersection. */
export namespace IAutoMovieCreateSupportSectionQuery {
  /**
   * Fixed oriented unit half-plane directions and minimum determinant magnitude
   * for reusable section queries.
   *
   * At query time the cached seed is admitted only after current inequalities
   * pass. If its reusable incidence cannot be established, the query enumerates
   * the prepared pairs. Finite scale admission can avoid precomputing every
   * coordinate, while uncertain arithmetic receives full preflight.
   */
  export type IInput = {
    /**
     * Ordered dense finite unit XZ normals surrounding a bounded chart.
     * Preparation copies them. Supply a bounded plane population.
     */
    normals: readonly (readonly [number, number])[];

    /**
     * Finite threshold strictly between zero and one. A feasible nonparallel
     * tight pair with smaller absolute determinant refuses.
     */
    minimumDirectionSine: number;
  };

  /**
   * Synchronous fixed-normal query taking one finite metre offset per normal
   * and returning a new counterclockwise polygon.
   *
   * Every call takes offsets in original direction order. A refused
   * intersection throws without transferring a partial polygon.
   */
  export type IResult = (
    offsets: readonly number[],
  ) => IAutoMovieSupportSectionVertex[];
}
