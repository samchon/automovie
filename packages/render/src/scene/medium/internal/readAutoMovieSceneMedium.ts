import type { IAutoMovieMedium } from "@automovie/interface";
import type * as THREE from "three";

import { AUTOMOVIE_SCENE_MEDIUM_KEY } from "../AUTOMOVIE_SCENE_MEDIUM_KEY.js";

/**
 * The physical haze `applySceneMedium` attached to a scene, or null when it
 * carries none.
 */
export const readAutoMovieSceneMedium: (
  scene: THREE.Scene,
) => IAutoMovieMedium | null = (scene: THREE.Scene): IAutoMovieMedium | null =>
  scene.userData[AUTOMOVIE_SCENE_MEDIUM_KEY] ?? null;
