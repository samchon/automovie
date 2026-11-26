import type { IAutoMovieSemanticMaskBinding } from "@automovie/interface";
import type * as THREE from "three";

import { SCENE_MASK_KEY } from "../SCENE_MASK_KEY.js";

/** The palette a scene was given, or `null` when it was given none. */
export const autoMovieSemanticMaskOf: (
  scene: THREE.Scene,
) => IAutoMovieSemanticMaskBinding | null = (
  scene: THREE.Scene,
): IAutoMovieSemanticMaskBinding | null => {
  const binding: IAutoMovieSemanticMaskBinding | undefined =
    scene.userData[SCENE_MASK_KEY];
  return binding ?? null;
};
