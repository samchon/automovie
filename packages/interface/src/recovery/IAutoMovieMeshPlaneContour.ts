import type { IAutoMovieMeshPlaneIntersection } from "..";

/** Ordered source polyline or isolated contact observed at one plane. */
export interface IAutoMovieMeshPlaneContour {
  /** Whether the observed edge population returns to its first cut point. */
  closed: boolean;

  /** Ordered registered cut points and their source intersection addresses. */
  pts: IAutoMovieMeshPlaneIntersection[];

  /**
   * Optional original triangle IDs that actually emitted the contour's source
   * segments or contact.
   */
  exactSourceTriangleIds?: readonly number[];

  /** Optional directed contour segment witnesses in observed traversal order. */
  orderedSegments?: Array<{
    /** Source cut occurrence identity for the corresponding ordered segment. */
    id: string;

    /**
     * Original source face IDs that emitted this segment, in ascending ordinal
     * order.
     */
    sourceTriangleIds: number[];
  }>;
}
