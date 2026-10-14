import type { IAutoMovieFilmTimeline } from "@automovie/interface";

/**
 * One existing frame-normalized film-timeline placement, borrowed by the production grammar observer. Source-out is exclusive and all frame fields use the owning production clock.
 *
 * @evidence contracts/common.md#principled-implementation An indexed access to the canonical timeline segment type preserves the exact authored edit representation rather than repeating its structural fields.
 * @evidence contracts/common.md#clear-and-simple-design This internal alias gives the observer and coordinator one placement vocabulary while the interface timeline remains the public data owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no shape admission or uniqueness proof; film assembly validates placements before invoking grammar observation.
 * @evidence contracts/common.md#meaningful-documentation States frame-clock units, exclusive source-out, borrowed placement ownership and the upstream admission premise.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased alias performs no runtime computation; the grammar observer accounts for actual map, geometry and boundary-sampling costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Both grammar declarations share the canonical timeline representation; this type owns no result cache or invalidation strategy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased type allocates and retains nothing; runtime placement references remain with the compilation attempt and its observer.
 */
export type filmGrammarSegment = IAutoMovieFilmTimeline["segments"][number];
