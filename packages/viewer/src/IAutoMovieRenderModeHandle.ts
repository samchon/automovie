import type {AutoMovieGuidePass} from "@automovie/interface";

/**
 * A reversible render-mode override. `restore()` puts every touched material,
 * visibility flag, background, and overlay back exactly as it was, so the same
 * built scene can be captured pass after pass without rebuilding: the
 * deterministic engine result is never mutated, only its projection.
 *
 * `restore()` also **disposes every resource the override created** (override
 * materials, the pose overlay's line geometries and material): a guide-pass
 * render applies and restores restoreAutoMovieRenderModeOnce per frame per pass, so an hour of film would
 * otherwise leak tens of thousands of WebGL materials. Borrowed originals are
 * never disposed; they belong to the scene. Restoring twice is safe: the second
 * call is a no-op, so nothing double-disposes.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Keeps this surface explicit about beauty versus structural output.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that distinction as a reversible render-product pass.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-state-isolation Restores every temporary pass mutation before another pass or frame can observe it.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Implements reversible pass-local scene and renderer state.
 * @author Samchon
 */
export interface IAutoMovieRenderModeHandle {
  /**
   * The pass this override draws.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Keeps this surface explicit about beauty versus structural output.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that distinction as a reversible render-product pass.
   */
  mode: AutoMovieGuidePass;

  /**
   * What the `mask` pass segmented, or `null` for every other pass and for a
   * mask pass drawn from the legacy index ramp.
   *
   * A structural pass is evidence, and evidence has to answer for what it left
   * out. These are the same three counts {@link IAutoMovieSemanticMaskHandle}
   * carries, surfaced here so the caller that asked for the pass can read them
   * without reaching past the handle it was given.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Keeps this surface explicit about beauty versus structural output.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that distinction as a reversible render-product pass.
   */
  semantic: {
    /** Meshes painted a semantic colour. */
    painted: number;
    /** Meshes left at the reserved background because no entry claimed them. */
    unaddressed: number;
    /** Semantic ids that name a drawable the scene does not hold. */
    unresolved: string[];
  } | null;

  /**
   * Undo the override completely. Idempotent.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Keeps this surface explicit about beauty versus structural output.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that distinction as a reversible render-product pass.
   */
  restore: () => void;
}
