import type { IAutoMovieSupportSectionVertex } from "./IAutoMovieSupportSectionVertex";

/** Single-query convex section intersection from fixed oriented half-planes. */
export namespace IAutoMovieEvaluateSupportSection {
  /**
   * One admitted set of oriented half-planes in a finite XZ metre chart.
   *
   * The input premises include finite dense arrays, matching offsets and a
   * bounded intersection with unit directions. The evaluator delegates
   * uncertain incidence to the determinant sign for the supplied binary64
   * data.
   */
  export type IInput = {
    /** Ordered dense finite unit normal pairs around a bounded XZ chart. */
    normals: readonly (readonly [number, number])[];

    /**
     * One borrowed finite metre offset per corresponding normal for the
     * inequality nx X plus nz Z at most h.
     */
    offsets: readonly number[];

    /**
     * Finite threshold in (0, 1), in absolute determinant units for unit
     * directions. A feasible tight pair below this threshold refuses.
     */
    minimumDirectionSine: number;
  };

  /**
   * New mutable polygon of feasible corners in counterclockwise XZ order, with
   * implicit closure.
   *
   * A result has at least three distinct vertices and positive representable
   * signed area.
   */
  export type IResult = IAutoMovieSupportSectionVertex[];
}
