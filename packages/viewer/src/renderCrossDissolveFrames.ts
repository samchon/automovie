import * as THREE from "three";
import {AutoMovieDisplayCompositor} from "./AutoMovieDisplayCompositor.js";
import {AutoMovieDissolveCompositorState as states} from "./AutoMovieDissolveCompositorState.js";

/**
 * Combine two independently resolved display frames with complementary byte
 * weights. Each callback owns its scene's tone and exposure. The renderer's
 * selected destination, canvas backing and clear state survive all exits.
 * Highp Float32 scalar thresholds permit one opaque byte of rounding versus
 * Float64 delivery; endpoints and identical opaque sources retain identity.
 * Low-alpha premultiplied canvas extraction is a presentation product; capture
 * an unassociated target for transparent straight RGBA delivery.
 *
 * The numerical contribution is the documented opaque highp Float32 byte bound. It does not certify an unobserved device precision profile or reinterpret low-alpha canvas presentation as straight delivery.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-scene-display-color Resolves each source through its direct display path exactly once.
 * @evidence requirements/rendering/frame-schedules-and-sampling.md#rendering-state-sampling Consumes the caller's sampled alpha without resampling either source.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Combines captured display bytes without tone mapping the composite.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-frame-schedule Preserves the supplied outgoing and incoming samples.
 *
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-hardware-variation Defines the supported highp Float32 opaque display-byte interpolation bound of one byte against Float64 nearest-integer composition, preserving endpoint and identical-source identity.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Defines the supported highp Float32 opaque display-byte interpolation bound of one byte against Float64 nearest-integer composition, preserving endpoint and identical-source identity.
 */
export const renderCrossDissolveFrames = (renderer: THREE.WebGLRenderer, renderOutgoing: () => void, renderIncoming: () => void, alpha: number): void => {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)
    throw new Error("Cross-dissolve alpha must be finite and inside [0, 1].");
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  let state = states.get(renderer);
  if (state === undefined) {
    state = new AutoMovieDisplayCompositor(size.x, size.y);
    states.set(renderer, state);
  } else state.resize(size.x, size.y);
  state.render(renderer, renderOutgoing, renderIncoming, alpha);
};

