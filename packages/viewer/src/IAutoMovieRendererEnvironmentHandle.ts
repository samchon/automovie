/**
 * A reversible renderer configuration for one beauty or structural pass.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-scene-display-color Keeps this surface on the declared scene-to-display color boundary.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Restores the declared scene-to-display color boundary after the pass.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-state-isolation Prevents one pass's renderer overrides from leaking into the next.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Implements reversible pass-local renderer state.
 * @author Samchon
 */
export interface IAutoMovieRendererEnvironmentHandle {
  /**
   * Restore every renderer property touched by the configuration.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-scene-display-color Keeps this surface on the declared scene-to-display color boundary.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Restores the declared scene-to-display color boundary after the pass.
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-state-isolation Prevents one pass's renderer overrides from leaking into the next.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Implements reversible pass-local renderer state.
   */
  restore: () => void;
}

