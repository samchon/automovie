import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * One automatic LOD decision with its combined selection metric.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability Reports both the retained or selected tier and the metric that crossed its hysteresis boundary.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Makes an automatic transition inspectable instead of returning an unexplained representation.
 */
export interface IAutoMovieFormationLodSelection {
  /**
   * Selected compiled tier.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability Identifies the representation retained or entered after hysteresis is applied.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Exposes the concrete transition outcome consumed by the renderer.
   */
  lod: IAutoMovieCompiledFormationLod;
  /**
   * Distance enlarged as projected contribution shrinks.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability Records the combined distance and pixel-contribution metric used at transition boundaries.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Makes the basis of the selected tier available for stability review.
   */
  effectiveDistance: number;
}
