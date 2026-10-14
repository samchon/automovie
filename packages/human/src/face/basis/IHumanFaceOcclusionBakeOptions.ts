/** Computational resolution of the existing vertex AO bake.
 *
 * @evidence contracts/common.md#principled-implementation Positive integer ray count and square texture edge determine native AO visibility sampling and UV raster resolution.
 * @evidence contracts/common.md#clear-and-simple-design Computational resolution remains separate from posed geometry and the shared alpha-mode-only material classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These are approximation/resource controls, not anatomical or optical accuracy guarantees; positivity alone sets no separate byte budget.
 * @evidence contracts/common.md#meaningful-documentation Members state rays per vertex and texture pixels with integer admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The options implement no bake; bakeHumanFaceOcclusion owns ray/pixel costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; builder-fixed resolution qualifies its image cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record acquires no resource; AO allocation belongs to the bake/cache owner.
 *
 * @author Samchon
 */
export interface IHumanFaceOcclusionBakeOptions {
  /** Positive integer cosine-weighted rays per receiving vertex. */
  rays: number;

  /** Positive integer edge length of each output texture in pixels. */
  size: number;
}
