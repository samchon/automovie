import type { IAutoMovieMedium } from "@automovie/interface";
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
  scene.userData[AUTOMOVIE_SCENE_MEDIUM_KEY] = {
    scattering: medium.scattering,
    absorption: medium.absorption,
    anisotropy: medium.anisotropy,
  } satisfies IAutoMovieMedium;
};
