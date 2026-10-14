/** One retained AO result for its geometric pose and actual opaque population.
 *
 * @evidence contracts/common.md#principled-implementation createHumanFaceOcclusionCache pairs immutable pose object identity with sorted actually used opaque-material ids under one builder-fixed bake resolution.
 * @evidence contracts/common.md#clear-and-simple-design One latest entry owns geometry/alpha-mode population equivalence and baked bindings; returned maps copy entries so consumer mutation cannot change cached bindings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pose immutability and complete geometric profiles are owner premises; equal colour alone does not justify AO reuse and opaque membership changes invalidate it.
 * @evidence contracts/common.md#meaningful-documentation Members state pose identity, alpha-mode-classified mesh material population and owned images versus copied maps; transmission and opacity do not participate in this approximation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This entry performs no bake; cache classification and baker own mesh/ray/pixel costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type schedules no work; the cache owner compares both keys before reusing images.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; one latest retained image population lives with the cache closure, with bytes determined by its textures.
 *
 * @author Samchon
 */
export interface IHumanFaceOcclusionCacheEntry {
  /** Read-only geometric pose identity supplied by the same builder. */
  pose: object;

  /** Sorted opaque material IDs actually used by mesh occluders. */
  opaqueMaterials: string;

  /** Owned baked image bindings; callers receive a separate map. */
  images: ReadonlyMap<string, string>;
}
