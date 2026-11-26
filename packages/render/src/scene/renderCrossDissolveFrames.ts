import * as THREE from "three";

import { AutoMovieDisplayCompositor } from "./internal/AutoMovieDisplayCompositor.js";
import { isAutoMovieDisplayBlendWeight } from "./internal/isAutoMovieDisplayBlendWeight.js";

/**
 * Combine two independently resolved display frames with complementary byte
 * weights. Each callback owns its scene's tone and exposure. The compositor
 * independently attempts restoration of the selected destination, canvas
 * backing and clear state; failed native restoration cannot guarantee their
 * survival. Highp Float32 scalar thresholds permit one opaque byte of rounding
 * versus Float64 delivery; endpoints and identical opaque sources retain
 * identity. Low-alpha premultiplied canvas extraction is a presentation
 * product; capture an unassociated target for transparent straight RGBA
 * delivery.
 *
 * The numerical contribution is the documented opaque highp Float32 byte bound.
 * It does not certify an unobserved device precision profile or reinterpret
 * low-alpha canvas presentation as straight delivery.
 *
 * The caller owns the compositor: it is resized to the drawing buffer here and
 * released by its owner, so no state outlives the call on this side.
 */
export const renderCrossDissolveFrames: (
  renderer: THREE.WebGLRenderer,
  compositor: AutoMovieDisplayCompositor,
  renderOutgoing: () => void,
  renderIncoming: () => void,
  alpha: number,
) => void = (
  renderer: THREE.WebGLRenderer,
  compositor: AutoMovieDisplayCompositor,
  renderOutgoing: () => void,
  renderIncoming: () => void,
  alpha: number,
): void => {
  if (!isAutoMovieDisplayBlendWeight(alpha))
    throw new Error("Cross-dissolve alpha must be finite and inside [0, 1].");
  const size: THREE.Vector2 = renderer.getDrawingBufferSize(
    new THREE.Vector2(),
  );
  compositor.resize(size.x, size.y);
  compositor.render(renderer, renderOutgoing, renderIncoming, alpha);
};
