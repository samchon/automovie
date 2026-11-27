/**
 * One construction curve of a lofted chain, sampled as a polyline in metres by
 * `sampleConstructionCurves`, so an inspection can draw the lines a
 * form was built from over its skin.
 *
 * A `section` is the closed ring of the surface at one principal layer station.
 * A `guide` is the open rail the surface follows along its stations at one
 * quarter phase. The `axis` is the open line through the centroids of the
 * sampled rings. All three are readings of the realized surface, not of the
 * authored tree.
 */
export interface IAutoMovieConstructionCurve {
  /**
   * Unique within one sampling: `<part>/section/<layer ordinal>`,
   * `<part>/guide/<quarter 0..3>`, `<part>/axis`.
   */
  id: string;

  /** Which construction line this is. */
  kind: IAutoMovieConstructionCurve.Kind;

  /** Name of the lofted chain, which is its construction node's name. */
  part: string;

  /** Whether the last point joins the first. */
  closed: boolean;

  /** Flat xyz in metres, without a repeated closing point. */
  points: number[];

  /**
   * True when the realization reported a diagnostic on this part, or a sample
   * was not finite and was left out.
   */
  flagged: boolean;
}

/** Data and callback contracts shared by the ConstructionCurve operations. */
export namespace IAutoMovieConstructionCurve {
  /**
   * The construction lines `sampleConstructionCurves` tells apart.
   *
   * `section` is a closed ring at one principal layer station, `guide` an open
   * rail along the stations at one of the four quarter phases, and `axis` the
   * open line through the centroids of the sampled rings.
   */
  export type Kind = "section" | "guide" | "axis";
}
