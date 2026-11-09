import { CutPoint } from "./CutPoint";

/**
 * Connected ordered source section, retaining explicit closure instead of an artificial cap.
 *
 * @evidence contracts/development/design.md#principled-representation Ordered CutPoint observations and graph-walk closure retain the actual contour; optional exact-face sets and ordered segment contributions preserve emission incidence without inferring a cap, fitted phase or surface jet.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One contour record owns point order, closure and optional provenance; cutting owns observation, while fitting and slab consumers retain separate qualification responsibilities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Open/failed/contact contours are not replaced by fixtures, largest components or invented closure; ordered records retain every traversed contribution without merging by coordinate proximity.
 * @evidence contracts/development/common.md#meaningful-documentation Members explain nonduplicated closed endpoints, actual versus endpoint-star face support, directed segment order, original input ordinals and omitted default metadata.
 */
export interface Polyline {
  /** True only when canonical source-cut adjacency returns to the first point. */
  closed: boolean;
  /** Ordered intersections; closure does not duplicate the first endpoint. */
  pts: CutPoint[];

  /** Optional acquisition provenance: original faces that emitted an actually visited cut segment or isolated contact, excluding unrelated endpoint-star neighbors. Omitted unless explicitly retained by the cutter. */
  exactSourceTriangleIds?: readonly number[];

  /** Opt-in directed graph-walk order; omitted by default and empty for contacts. */
  orderedSegments?: Array<{
    /** Private graph edge; array order follows consecutive pts and actual closure. */
    id: string;

    /** Original input faces emitting this contribution, excluding endpoint-star neighbors. */
    sourceTriangleIds: number[];
  }>;
}
