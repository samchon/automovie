import { CutPoint } from "./CutPoint";

/**
 * Connected ordered source section, retaining explicit closure instead of an artificial cap.
 *
 * @evidence contracts/common.md#principled-implementation Ordered CutPoint observations and graph-walk closure retain the actual contour; optional exact-face sets and ordered segment contributions preserve emission incidence without inferring a cap, fitted phase or surface jet.
 * @evidence contracts/common.md#clear-and-simple-design One contour record owns point order, closure and optional provenance; cutting owns observation, while fitting and slab consumers retain separate qualification responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Open/failed/contact contours are not replaced by fixtures, largest components or invented closure; ordered records retain every traversed contribution without merging by coordinate proximity.
 * @evidence contracts/common.md#meaningful-documentation Members explain nonduplicated closed endpoints, actual versus endpoint-star face support, directed segment order, original input ordinals and omitted default metadata.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
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
