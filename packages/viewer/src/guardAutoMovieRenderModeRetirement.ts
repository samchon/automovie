import type * as THREE from "three";

import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/** One active or failed installation retains its original restoration population. */
const retiring: WeakMap<
  THREE.Scene,
  { run: () => void; active: boolean; error: unknown }
> = new WeakMap();

/**
 * Refuse another pass on a scene whose owned material restoration is active or failed. The callback closes over the original swaps and created materials, retaining uncertain owners even when setup returns no handle or a scene-pass caller discards its failed handle. Successful cleanup withdraws the record; an original setup refusal still propagates without marking healthy cleanup as uncertain.
 *
 * @evidence contracts/common.md#principled-implementation Stores the actual restoration callback before running it, retains its original cleanup cause and population after failure, and refuses later same-scene acquisitions; successful cleanup removes only that record.
 * @evidence contracts/common.md#clear-and-simple-design Each primitive still collects/restores its resources; nested owned cleanup can run beneath an active parent whose callback retains that population, while admission-only calls cannot start another pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleared slots or discarded handles cannot invent release, active/failed admission cannot acquire another pass and nested independent cleanup must still run; supplied setup errors do not make healthy cleanup terminal or prove native release.
 * @evidence contracts/common.md#meaningful-documentation Defines scene identity, callback-held owner retention, failure propagation, setup-versus-cleanup outcome and public completion limits without another resource manager or renderer host.
 * @evidence contracts/performance.md#efficient-algorithms Weak lookup and fixed outcome coordination add constant work; the supplied callback retains and traverses its actual mesh/material population with its own declared cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeat admission shares the exact failed outcome instead of redisposing or replacing unknown resources; a healthy completed installation withdraws its gate and a subsequent pass owns new work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The weak scene key retains only its active or failed callback and cause, including captured original resources; success deletes them and the scene's lifetime bounds unresolved ownership without acquiring a new GPU resource.
 */
export function guardAutoMovieRenderModeRetirement(
  scene: THREE.Scene,
  attempt?: { run: () => void; primary?: { error: unknown } },
): void {
  const previous:
    | { run: () => void; active: boolean; error: unknown }
    | undefined = retiring.get(scene);
  if (previous !== undefined) {
    if (attempt === undefined || !previous.active) throw previous.error;
    // An outer Edge owner must still retire its already-owned fill; the parent callback retains that handle and collects the nested cause.
    if (attempt.primary === undefined) attempt.run();
    else restoreAutoMovieRenderModeState([attempt.run], attempt.primary);
    return;
  }
  if (attempt === undefined) return;
  const current: { run: () => void; active: boolean; error: unknown } = {
    run: attempt.run,
    active: true,
    error: new Error("The scene's pass resources are still being restored."),
  };
  retiring.set(scene, current);
  try {
    current.run();
  } catch (error) {
    current.active = false;
    if (attempt.primary === undefined) current.error = error;
    else {
      try {
        restoreAutoMovieRenderModeState(
          [
            (): never => {
              throw error;
            },
          ],
          attempt.primary,
        );
      } catch (failure) {
        current.error = failure;
      }
    }
    throw current.error;
  }
  retiring.delete(scene);
  if (attempt.primary !== undefined) throw attempt.primary.error;
}
