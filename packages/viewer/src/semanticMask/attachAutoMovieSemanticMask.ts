import type * as THREE from "three";
import type { IAutoMovieSemanticMaskBinding } from "./IAutoMovieSemanticMaskBinding.js";
import { SCENE_MASK_KEY } from "./SCENE_MASK_KEY.js";

/**
 * Hand a built scene the palette its `mask` pass must paint it with.
 *
 * The scene carries it, rather than every caller passing it down, for the same
 * reason a formation's baked cycle rides on its own mesh: the pass boundary
 * that needs it is several calls below whoever knows it. A compiled shot's
 * runtime hands `applyRenderMode` a pass name and nothing else, so a mask that
 * had to arrive as an argument could only arrive by widening every signature
 * between the page and the pass. A scene given no palette keeps the legacy
 * index ramp, which is what an asset turntable and any host without a compiled
 * design draw.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Makes this public surface part of the stable identity-mask channel.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that channel as a structural render product.
 * @author Samchon
 */
export const attachAutoMovieSemanticMask = (
  scene: THREE.Scene,
  binding: IAutoMovieSemanticMaskBinding,
): void => {
  scene.userData[SCENE_MASK_KEY] = binding;
};
