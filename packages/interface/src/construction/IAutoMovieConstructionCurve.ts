/**
 * Inspection polyline sampled from a realized loft chain in construction-frame
 * metres. Sections close around a principal station. Guides follow the four
 * quarter phases along the chain. The axis joins the sampled ring centroids.
 */
export interface IAutoMovieConstructionCurve {
  /**
   * Sampling-local identifier formed as part/section/layer ordinal,
   * part/guide/quarter index or part/axis.
   */
  id: string;

  /** Select a section ring, quarter guide or sampled centroid axis. */
  kind: IAutoMovieConstructionCurve.Kind;

  /** Name of the realized chain that supplies the geometry. */
  part: string;

  /**
   * Whether drawing should join the last sample to the first. Section rings are
   * closed.
   */
  closed: boolean;

  /**
   * Flat sequence of world XYZ samples in construction-frame metres. Draw a
   * closed ring without repeating its first point.
   */
  points: number[];

  /** Whether the named chain had a realization diagnostic during sampling. */
  flagged: boolean;
}

/** Data and callback contracts shared by the ConstructionCurve operations. */
export namespace IAutoMovieConstructionCurve {
  /**
   * Inspection curve category. Section closes one layer's ring, guide follows
   * one cardinal phase through stations, and axis follows ring centroids.
   */
  export type Kind = "section" | "guide" | "axis";
}
