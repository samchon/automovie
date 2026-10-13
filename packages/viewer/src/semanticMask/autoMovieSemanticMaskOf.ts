import type * as THREE from "three";
import type { IAutoMovieSemanticMaskBinding } from "./IAutoMovieSemanticMaskBinding.js";
import { SCENE_MASK_KEY } from "./SCENE_MASK_KEY.js";

/** The palette a scene was given, or `null` when it was given none. */
export const autoMovieSemanticMaskOf = (
  scene: THREE.Scene,
): IAutoMovieSemanticMaskBinding | null =>
  (scene.userData[SCENE_MASK_KEY] as
    | IAutoMovieSemanticMaskBinding
    | undefined) ?? null;
