import * as THREE from "three";

import { AutoMovieDisplayCompositor } from "./AutoMovieDisplayCompositor.js";
import { AutoMovieFadeCompositorState as states } from "./AutoMovieFadeCompositorState.js";

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
 */
export const renderFadeToBlackFrame: (
  renderer: THREE.WebGLRenderer,
  renderFrame: () => void,
  weight: number,
  transparent?: boolean,
) => void = (
  renderer: THREE.WebGLRenderer,
  renderFrame: () => void,
  weight: number,
  transparent: boolean = false,
): void => {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1)
    throw new Error("Film fade weight must be finite and inside [0, 1].");
  const size: THREE.Vector2 = renderer.getDrawingBufferSize(
    new THREE.Vector2(),
  );
  let state: AutoMovieDisplayCompositor | undefined = states.get(renderer);
  if (state === undefined) {
    state = new AutoMovieDisplayCompositor(size.x, size.y);
    states.set(renderer, state);
  } else state.resize(size.x, size.y);
  state.render(renderer, renderFrame, null, 1 - weight, transparent);
};
