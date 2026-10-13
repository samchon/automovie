import * as THREE from "three";
import {AutoMovieDisplayCompositor} from "./AutoMovieDisplayCompositor.js";
import {AutoMovieFadeCompositorState as states} from "./AutoMovieFadeCompositorState.js";

/**
 * Fade one directly resolved display frame over opaque black. The weight acts
 * on captured display bytes, including source-local tone and exposure, once.
 * The renderer's target and clear state are restored on every exit.
 * Highp Float32 scalar thresholds permit one opaque byte of rounding versus
 * Float64 delivery; weight one retains identity. Transparent straight delivery
 * uses an unassociated target, not low-alpha premultiplied canvas extraction.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-scene-display-color Preserves the direct layer's display transform before weighting its resolved bytes.
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Applies a beauty-only byte contribution without changing structural products.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Uses display-byte composition without a second display transform.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Restores renderer state after the source and composite.
 */
export const renderFadeToBlackFrame = (renderer: THREE.WebGLRenderer, renderFrame: () => void, weight: number): void => {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1)
    throw new Error("Film fade weight must be finite and inside [0, 1].");
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  let state = states.get(renderer);
  if (state === undefined) {
    state = new AutoMovieDisplayCompositor(size.x, size.y);
    states.set(renderer, state);
  } else state.resize(size.x, size.y);
  state.render(renderer, renderFrame, null, 1 - weight);
};

