import type * as THREE from "three";

import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/** One active or failed installation retains its original restoration population. */
const retiring: WeakMap<
  THREE.Scene,
  { run: () => void; active: boolean; error: unknown }
> = new WeakMap();

/**
 * Refuse another pass on a scene whose owned material restoration is active or failed. The callback closes over the original swaps and created materials, retaining uncertain owners even when setup returns no handle or a scene-pass caller discards its failed handle. Successful cleanup withdraws the record; an original setup refusal still propagates without marking healthy cleanup as uncertain.
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
