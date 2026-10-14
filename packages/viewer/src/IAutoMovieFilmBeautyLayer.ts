/**
 * The minimum film-layer shape needed to decide beauty composition.
 *
 * @evidence contracts/common.md#principled-implementation One scalar contribution lets the generic beauty resolver classify direct, fade and complementary dissolve decisions while preserving richer sampled-layer records.
 * @evidence contracts/common.md#clear-and-simple-design Composition admission depends only on weight, so this minimal interface avoids coupling the resolver to scenes, cameras or shot identifiers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weights represent sampled display contributions for arbitrary film layers and carry no fixture-specific transition names.
 * @evidence contracts/common.md#meaningful-documentation The member documents the unit interval and application to source display bytes rather than linear scene radiance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This scalar shape performs no blend or layer-list traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Per-frame sampled weight values coordinate no reusable work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A numeric contribution holds no texture, camera or other resource lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieFilmBeautyLayer {
  /** Sampled contribution in `[0, 1]`, applied to source display bytes. */
  weight: number;
}
