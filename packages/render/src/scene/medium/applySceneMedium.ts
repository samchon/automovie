import { validateSceneMedium } from "@automovie/engine";
import type {
  IAutoMovieMedium,
  IAutoMovieValidation,
} from "@automovie/interface";
import type * as THREE from "three";

import { AUTOMOVIE_SCENE_MEDIUM_KEY } from "./AUTOMOVIE_SCENE_MEDIUM_KEY.js";

/**
 * Attach the scene's physical haze to a built `three.js` scene, or remove it
 * when nothing is declared.
 *
 * Exported, and separate from `buildScene`, for the reason `applySceneFog` is:
 * a production that assembles its own scene graph attaches the film's medium
 * through this one call. The medium is stored verbatim, a copy of the three
 * coefficients, under {@link AUTOMOVIE_SCENE_MEDIUM_KEY}; the film response
 * stage reads it with `readAutoMovieSceneMedium` and draws it in the linear
 * beauty target. Absent or `null` removes it, so the scene draws clear air.
 *
 * A medium `validateSceneMedium` refuses, a negative or non-finite coefficient
 * or an anisotropy outside (−1, 1), throws a `RangeError` and leaves the scene
 * as it was, since the march's phase function is 0/0 at an anisotropy of one.
 * Whether the scene also carries a fog is the scene's to admit: `buildScene`
 * refuses an `IAutoMovieScene` with both before it calls this.
 */
export const applySceneMedium: (
  scene: THREE.Scene,
  medium: IAutoMovieMedium | null | undefined,
) => void = (
  scene: THREE.Scene,
  medium: IAutoMovieMedium | null | undefined,
): void => {
  if (medium === null || medium === undefined) {
    delete scene.userData[AUTOMOVIE_SCENE_MEDIUM_KEY];
    return;
  }
  const admitted: IAutoMovieValidation = validateSceneMedium({ medium });
  if (!admitted.success)
    throw new RangeError(
      "Unsupported scene medium: " + JSON.stringify(admitted.violations),
    );
  scene.userData[AUTOMOVIE_SCENE_MEDIUM_KEY] = {
    scattering: medium.scattering,
    absorption: medium.absorption,
    anisotropy: medium.anisotropy,
  } satisfies IAutoMovieMedium;
};
