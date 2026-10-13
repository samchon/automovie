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
 * @author Samchon
 */
export const attachAutoMovieSemanticMask = (
  scene: THREE.Scene,
  binding: IAutoMovieSemanticMaskBinding,
): void => {
  scene.userData[SCENE_MASK_KEY] = binding;
};
