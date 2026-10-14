import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Bounded viewer accounting for one general instance set.
 *
 * @evidence contracts/common.md#principled-implementation Fixed counts distinguish slots assigned to visible LOD batches, chunk-frustum exclusions and authored or seeded hidden slots. These counters describe viewer selection state rather than observed renderer submissions or visible pixels.
 * @evidence contracts/common.md#clear-and-simple-design A small count record gives the host accounting without exposing prototype/chunk implementation state or retaining per-slot debug records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hidden slots are not relabeled culled to make draw totals agree with a particular camera.
 * @evidence contracts/common.md#meaningful-documentation Each member states which visibility cause contributes to its count and the visible tier-key meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Count fields execute no LOD selection or slot traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The per-frame summary is a value and coordinates no cached calculation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The statistics retain only a fixed number of numeric counts, with no mesh or member resource references.
 *
 * @author Samchon
 */
export interface IAutoMovieInstanceSetViewerStats {
  /** Slots assigned to currently visible batches by automatic LOD tier, without measuring native submissions or pixels. */
  visible: Record<IAutoMovieCompiledFormationLod["tier"], number>;

  /** Slots rejected by chunk-frustum culling. */
  culled: number;

  /** Slots intentionally hidden by authored or seeded visibility. */
  hidden: number;
}
