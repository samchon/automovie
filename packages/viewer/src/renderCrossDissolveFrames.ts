import * as THREE from "three";
import {AutoMovieDisplayCompositor} from "./AutoMovieDisplayCompositor.js";
import {AutoMovieDissolveCompositorState as states} from "./AutoMovieDissolveCompositorState.js";

/**
 * Combine two independently resolved display frames with complementary byte weights. Each callback owns its scene's tone and exposure. The compositor independently attempts restoration of the selected destination, canvas backing and clear state; failed native restoration cannot guarantee their survival. Highp Float32 scalar thresholds permit one opaque byte of rounding versus Float64 delivery; endpoints and identical opaque sources retain identity. Low-alpha premultiplied canvas extraction is a presentation product; capture an unassociated target for transparent straight RGBA delivery.
 *
 * The numerical contribution is the documented opaque highp Float32 byte bound. It does not certify an unobserved device precision profile or reinterpret low-alpha canvas presentation as straight delivery.
 *
 * @evidence contracts/common.md#principled-implementation Rejects nonfinite/out-of-range alpha before effects, acquires or resizes the actual renderer-keyed compositor and combines two original display-frame callbacks with complementary byte weights.
 * @evidence contracts/common.md#clear-and-simple-design Small renderer-lifetime dispatch stays separate from source tone/exposure callbacks and compositor destination/state ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Documented opaque highp Float32 byte tolerance is not unobserved device-precision proof; low-alpha premultiplied canvas output is presentation, and failed terminal owner cannot be silently reused or replaced.
 * @evidence contracts/common.md#meaningful-documentation Documents destination/clear survival, source-local tone, rounding/endpoint identity and straight transparent delivery through an unassociated target.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch/size lookup is fixed while composition performs actual source draws/copies and per-pixel mix; unchanged extents reuse existing storage and resized extents delegate retirement to the owner.
 * @evidence contracts/performance.md#reuse-equivalent-work One WeakMap owner per renderer reuses equivalent live display-copy extent, but every requested source frame executes its original callback and terminal failed owners retain their outcome.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one active dissolve owner per renderer retains three copy extents plus native compositor resources; disposal owner removes only successful lifetimes and failed retained extents remain reported until the renderer key becomes unreachable.
 */
export const renderCrossDissolveFrames: (renderer: THREE.WebGLRenderer, renderOutgoing: () => void, renderIncoming: () => void, alpha: number) => void = (renderer: THREE.WebGLRenderer, renderOutgoing: () => void, renderIncoming: () => void, alpha: number): void => {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)
    throw new Error("Cross-dissolve alpha must be finite and inside [0, 1].");
  const size: THREE.Vector2 = renderer.getDrawingBufferSize(new THREE.Vector2());
  let state: AutoMovieDisplayCompositor | undefined = states.get(renderer);
  if (state === undefined) {
    state = new AutoMovieDisplayCompositor(size.x, size.y);
    states.set(renderer, state);
  } else state.resize(size.x, size.y);
  state.render(renderer, renderOutgoing, renderIncoming, alpha);
};

