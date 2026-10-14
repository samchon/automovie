import type * as THREE from "three";

import { AutoMovieDissolveCompositorState as states } from "./AutoMovieDissolveCompositorState.js";

/**
 * Release renderer-owned dissolve copies and quad resources once. Success
 * removes the entry so a later dissolve can acquire a fresh compositor; failure
 * retains the closed owner and its original completion, refusing further draws.
 *
 * @evidence contracts/common.md#principled-implementation Retires the actual renderer-keyed compositor before removing ownership; successful release permits a fresh later owner, while failed release retains its closed resource references and original disposal cause rather than producing false success on repetition.
 * @evidence contracts/common.md#clear-and-simple-design The WeakMap joins existing dissolve draw/release paths to one compositor; this boundary owns registry transfer and the class owns independent resource release/completion sharing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native disposer is replaced, retried or treated as successful after throwing; absence means no registered owner, while real failed ownership remains observable to subsequent draw/release calls.
 * @evidence contracts/common.md#meaningful-documentation States successful-entry removal, fresh later acquisition and failed closed-owner retention/refusal, distinguishing public completion from physical GPU retirement.
 * @evidence contracts/performance.md#efficient-algorithms Performs one WeakMap lookup, one fixed five-resource owner retirement and successful deletion, constant adapter work/storage independent of frames or raster dimensions.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated failed releases reuse the compositor's stored cause without native calls; repeated successful releases see no entry, and a later supported draw creates an independent fresh owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Renderer-keyed WeakMap retains the failed compositor/resources only while the renderer key is reachable; successful release removes the entry after all public operations fulfill. This primitive neither disposes the renderer nor certifies its physical context lifetime.
 */
export const disposeCrossDissolve: (renderer: THREE.WebGLRenderer) => void = (
  renderer: THREE.WebGLRenderer,
): void => {
  const state: ReturnType<typeof states.get> = states.get(renderer);
  if (state === undefined) return;
  state.dispose();
  states.delete(renderer);
};
