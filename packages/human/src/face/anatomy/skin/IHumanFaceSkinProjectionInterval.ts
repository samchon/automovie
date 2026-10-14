import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";

/**
 * One interval of the quadratic nearest-distance lower envelope. The chosen
 * feature supplies the affine point and never creates a new surface edge.
 *
 * @evidence contracts/common.md#principled-implementation The lower envelope assigns one valid native affine feature to each represented guide interval; the course compiler checks adjacency and continuity rather than adding an edge between unrelated sheets.
 * @evidence contracts/common.md#clear-and-simple-design A feature reference and two bounds describe ownership without duplicating its affine coefficients or the source geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Interval boundaries follow domain ends and actual quadratic crossings, not uniform guide sampling or relief-width subdivisions.
 * @evidence contracts/common.md#meaningful-documentation Members identify the selected feature and dimensionless [0,1] bounds; this record itself provides no new surface edge.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interval type executes no envelope merge or projection evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The interval references its existing feature but coordinates no equivalent-work cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ordinary interval retention belongs to the envelope/course caller; this declaration acquires no resource.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionInterval {
  /** Selected native feature. */
  feature: IHumanFaceSkinProjectionFeature;

  /** Interval start in [0,1]. */
  lower: number;

  /** Interval end in [0,1]. */
  upper: number;
}
