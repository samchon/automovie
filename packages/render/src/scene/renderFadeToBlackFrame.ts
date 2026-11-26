import * as THREE from "three";

import { AutoMovieDisplayCompositor } from "./internal/AutoMovieDisplayCompositor.js";
import { isAutoMovieDisplayBlendWeight } from "./internal/isAutoMovieDisplayBlendWeight.js";

/**
 * Fade one directly resolved display frame over opaque black, or with
 * `transparent` toward a fully transparent pixel, so the frame's straight
 * colour stays its own and only its alpha falls. The weight acts on captured
 * display bytes, including source-local tone and exposure, once. Target and
 * clear-state restoration are independently attempted on exit, with native
 * restoration failures reported rather than certified restored. Highp Float32
 * scalar thresholds permit one opaque byte of rounding versus Float64 delivery;
 * weight one retains identity. Transparent straight delivery uses an
 * unassociated target, not low-alpha premultiplied canvas extraction.
 *
 * The caller owns the compositor: it is resized to the drawing buffer here and
 * released by its owner.
 */
export const renderFadeToBlackFrame: (
  renderer: THREE.WebGLRenderer,
  compositor: AutoMovieDisplayCompositor,
  renderFrame: () => void,
  weight: number,
  transparent?: boolean,
) => void = (
  renderer: THREE.WebGLRenderer,
  compositor: AutoMovieDisplayCompositor,
  renderFrame: () => void,
  weight: number,
  transparent: boolean = false,
): void => {
  if (!isAutoMovieDisplayBlendWeight(weight))
    throw new Error("Film fade weight must be finite and inside [0, 1].");
  const size: THREE.Vector2 = renderer.getDrawingBufferSize(
    new THREE.Vector2(),
  );
  compositor.resize(size.x, size.y);
  compositor.render(renderer, renderFrame, null, 1 - weight, transparent);
};
