import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * A declared contour topology event prepared for adjacent-slab planning.
 *
 * Document preparation copies the critical coordinate, saved cut bracket,
 * terminal and signed loop addresses into generation-local work data. The link
 * fields encode the authored event kind and regular flag. Slab planning borrows
 * the event objects and retains unsupported relationships as local omissions.
 */
export interface IAutoMoviePreparedContourEvent64 {
  /**
   * Declared critical coordinate along the common cutting direction,
   * millimetres.
   */
  y: number;

  /** Declared lower saved-section coordinate, millimetres. */
  y0: number;

  /** Declared upper saved-section coordinate, millimetres. */
  y1: number;

  /**
   * Copied extremum terminal in world millimetres, or null for a saddle
   * declaration.
   */
  point: AutoMovieVector3Tuple | null;

  /** Incident loops at y0 with winding copied from their saved section. */
  below: IAutoMoviePreparedContourEvent64.IIncident[];

  /** Incident loops at y1 with winding copied from their saved section. */
  above: IAutoMoviePreparedContourEvent64.IIncident[];

  /**
   * Preparation writes 0 for a minimum and 1 otherwise; this is a declared-kind
   * flag rather than a measured component count.
   */
  lowerLinkComponents: number;

  /**
   * Preparation writes 0 for a maximum and 1 otherwise; terminal emission uses
   * it to identify the vanishing side.
   */
  upperLinkComponents: number;

  /** Authored regularity copied to the link field during preparation. */
  manifoldLink: boolean;

  /**
   * Negation of authored regularity used by the current preparation adapter.
   * The adapter derives this flag without a neighboring-vertex measurement.
   */
  equalHeightNeighbour: boolean;

  /**
   * Local event-admission refusal, when present; absence permits subsequent
   * incidence checks but does not certify embedding.
   */
  unsupported?: string;
}

/** Saved-section incidence belonging to one prepared event. */
export namespace IAutoMoviePreparedContourEvent64 {
  /** One local loop ordinal and its signed material-boundary orientation. */
  export interface IIncident {
    /** Zero-based loop ordinal within the containing side's saved section. */
    loop: number;

    /**
     * Saved loop orientation: admitted declarations use +1 for an outer
     * boundary and -1 for a cavity.
     */
    winding: number;
  }
}
