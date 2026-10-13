import * as THREE from "three";
import {type IAutoMovieSemanticMaskBinding, applyAutoMovieSemanticMask} from "./semanticMask/index.js";
import type {IAutoMovieRenderModeHandle} from "./IAutoMovieRenderModeHandle.js";

import {restoreAutoMovieRenderModeOnce} from "./restoreAutoMovieRenderModeOnce.js";

/**
 * Mask pass over the stable semantic palette the scene was handed.
 *
 * The pass boundary above has already suspended fog, image lighting, the
 * background and every non-mesh renderable, and
 * {@link applyAutoMovieSemanticMask} suspends the same four itself so a direct
 * caller is as correct as this one. Nesting them is exact rather than merely
 * harmless: each side restores what it found, so the inner black background is
 * put back before the outer one restores the scene's own.
 */
export const applySemanticMaskMode = (
  scene: THREE.Scene,
  binding: IAutoMovieSemanticMaskBinding,
): IAutoMovieRenderModeHandle => {
  const handle = applyAutoMovieSemanticMask({
    scene,
    design: binding.design,
    mask: binding.mask,
  });
  return {
    mode: "mask",
    semantic: {
      painted: handle.painted,
      unaddressed: handle.unaddressed,
      unresolved: handle.unresolved,
    },
    restore: restoreAutoMovieRenderModeOnce(handle.restore),
  };
};
