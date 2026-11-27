import type { IAutoMovieLoftSectionJet } from "./IAutoMovieLoftSectionJet";

/** Original-cap station preparation shared by the cap reader and loft jet cache. */
export namespace IAutoMovieLoftCapRead {
  /**
   * Prepared local and frame derivatives at one positive original-cap station.
   *
   * Null means that no retained original cap owns this station. A collapsed tip
   * or unavailable physical derivatives cause AutoMovieEngineLoftCapRead.jet to throw
   * AutoMovieEngineLoftAdmissionError; axis callback and stale-binding errors
   * propagate. Finite point evaluation alone does not qualify a station for
   * this result. The receiving loft jet cache retains the closure and copied
   * rows under its immutable chain key.
   */
  export type IJetResult = {
    /**
     * Evaluate local [u,v] position and partials at finite polar phase phi in
     * radians; the closure retains its prepared scalar geometry and returns
     * fresh mutable vectors. Numeric admission failures throw.
     */
    native: (phi: number) => IAutoMovieLoftSectionJet;

    /**
     * Three copied rows in value, first-station and second-station order, each
     * [origin.xyz, u.xyz, v.xyz]. Origin units are mm, unitless and 1/mm; axis
     * units are unitless, 1/mm and 1/mm². Consumers preserve these mutable rows
     * while the station plan is cached.
     */
    f: number[][];
  } | null;
}
