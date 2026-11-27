import type { IAutoMovieMeshPlaneIntersection } from "..";

/**
 * Connected ordered source section, retaining explicit closure instead of an
 * artificial cap.
 */
export interface IAutoMovieMeshPlaneContour {
  /** True only when canonical source-cut adjacency returns to the first point. */
  closed: boolean;

  /** Ordered intersections; closure does not duplicate the first endpoint. */
  pts: IAutoMovieMeshPlaneIntersection[];

  /**
   * Optional acquisition provenance: original faces that emitted an actually
   * visited cut segment or isolated contact, excluding unrelated endpoint-star
   * neighbors. Omitted unless explicitly retained by the cutter.
   */
  exactSourceTriangleIds?: readonly number[];

  /**
   * Opt-in directed graph-walk order; omitted by default and empty for
   * contacts.
   */
  orderedSegments?: Array<{
    /**
     * Private graph edge; array order follows consecutive pts and actual
     * closure.
     */
    id: string;

    /**
     * Original input faces emitting this contribution, excluding endpoint-star
     * neighbors.
     */
    sourceTriangleIds: number[];
  }>;
}
