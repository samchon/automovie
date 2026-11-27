import type * as THREE from "three";

import { restoreRenderModeState } from "./restoreRenderModeState";

/*
 * Refuse another pass on a scene whose owned material restoration is active or
 * failed. The callback closes over the original swaps and created materials,
 * retaining uncertain owners even when setup returns no handle or a scene-pass
 * caller discards its failed handle. Successful cleanup withdraws the record;
 * an original setup refusal still propagates without marking healthy cleanup as
 * uncertain.
 */
export function guardRenderModeRetirement(
  scene: THREE.Scene,
  attempt?: { run: () => void; primary?: { error: unknown } },
): void {
  const previous: IRetirement | undefined = scene.userData[RETIRING];
  if (previous !== undefined) {
    if (attempt === undefined || !previous.active) throw previous.error;
    // An outer Edge owner must still retire its already-owned fill; the parent callback retains that handle and collects the nested cause.
    if (attempt.primary === undefined) attempt.run();
    else restoreRenderModeState([attempt.run], attempt.primary);
    return;
  }
  if (attempt === undefined) return;
  const current: IRetirement = {
    run: attempt.run,
    active: true,
    error: new Error("The scene's pass resources are still being restored."),
  };
  scene.userData[RETIRING] = current;
  try {
    current.run();
  } catch (error) {
    current.active = false;
    if (attempt.primary === undefined) current.error = error;
    else {
      try {
        restoreRenderModeState(
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
  delete scene.userData[RETIRING];
  if (attempt.primary !== undefined) throw attempt.primary.error;
}

/*
 * The scene userData key of its active or failed restoration record, which
 * retains the original restoration population.
 */
const RETIRING: string = "automovieRenderModeRetirement";

/*
 * One active or failed installation's restoration record.
 */
interface IRetirement {
  /*
   * The restoration of the installation's swaps and created materials.
   */
  run: () => void;

  /*
   * Whether the restoration is still running.
   */
  active: boolean;

  /*
   * The refusal a later pass receives.
   */
  error: unknown;
}
