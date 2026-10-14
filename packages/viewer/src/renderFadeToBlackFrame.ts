import * as THREE from "three";

import { AutoMovieDisplayCompositor } from "./AutoMovieDisplayCompositor.js";
import { AutoMovieFadeCompositorState as states } from "./AutoMovieFadeCompositorState.js";

/**
 * Fade one directly resolved display frame over opaque black. The weight acts on captured display bytes, including source-local tone and exposure, once. Target and clear-state restoration are independently attempted on exit, with native restoration failures reported rather than certified restored. Highp Float32 scalar thresholds permit one opaque byte of rounding versus Float64 delivery; weight one retains identity. Transparent straight delivery uses an unassociated target, not low-alpha premultiplied canvas extraction.
 *
 * @evidence contracts/common.md#principled-implementation Admits finite weight inside0..1 before effects, acquires/resizes the actual renderer-keyed fade compositor and renders the original source over opaque black with alpha1-weight.
 * @evidence contracts/common.md#clear-and-simple-design One lifetime dispatcher leaves source tone/exposure and destination/state ownership with the existing callback/compositor owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No weight clamp or assumed device precision invents a successful frame; transparent premultiplied canvas output is presentation and a failed terminal compositor retains its original refusal.
 * @evidence contracts/common.md#meaningful-documentation Documents byte-domain fade, source-local tone, destination restoration, opaque rounding/endpoint bound and straight transparent delivery through an unassociated target.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch/size lookup is fixed while original source draw/copy and per-pixel composition dominate; unchanged extents reuse live storage and changed extents delegate retirement to the compositor.
 * @evidence contracts/performance.md#reuse-equivalent-work One actual WeakMap owner per renderer reuses equivalent live copy extent; a requested source frame still executes its original callback and failed owner state cannot be silently replaced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The renderer owner retains three potential copy extents plus compositor resources until successful disposal; failed resize/dispose remains terminal with uncertain old extent and no new draw or native retry.
 */
export const renderFadeToBlackFrame: (
  renderer: THREE.WebGLRenderer,
  renderFrame: () => void,
  weight: number,
) => void = (
  renderer: THREE.WebGLRenderer,
  renderFrame: () => void,
  weight: number,
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
  state.render(renderer, renderFrame, null, 1 - weight);
};
