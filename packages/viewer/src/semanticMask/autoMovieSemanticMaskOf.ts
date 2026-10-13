import type * as THREE from "three";
import type { IAutoMovieSemanticMaskBinding } from "./IAutoMovieSemanticMaskBinding.js";
import { SCENE_MASK_KEY } from "./SCENE_MASK_KEY.js";

/**
 * The palette a scene was given, or `null` when it was given none.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Makes this public surface part of the stable identity-mask channel.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that channel as a structural render product.
 */
export const autoMovieSemanticMaskOf = (
  scene: THREE.Scene,
): IAutoMovieSemanticMaskBinding | null =>
  (scene.userData[SCENE_MASK_KEY] as
    | IAutoMovieSemanticMaskBinding
    | undefined) ?? null;
