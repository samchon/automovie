import type { IAutoMovieSemanticMaskBinding } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRenderModeHandle } from "../IAutoMovieRenderModeHandle";
import { restoreRenderModeOnce } from "./restoreRenderModeOnce";
import type { IAutoMovieRenderSemanticMaskHandle } from "../IAutoMovieRenderSemanticMaskHandle";
import { AutoMovieRenderSemanticMask } from "../AutoMovieRenderSemanticMask";

/*
 * Mask pass over the stable semantic palette the scene was handed.
 *
 * The outer pass boundary suspends fog, image lighting, background and non-mesh
 * renderables. AutoMovieRenderSemanticMask.apply snapshots those already
 * suspended values for its own install. Inner restoration returns the outer
 * boundary's black background and suspended state, then outer restoration
 * returns the original background, atmosphere and helper visibility. Coverage
 * counts scene membership and palette resolution, not visible or rasterized
 * pixels.
 */
export const applySemanticMaskMode: (
  scene: THREE.Scene,
  binding: IAutoMovieSemanticMaskBinding,
) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
  binding: IAutoMovieSemanticMaskBinding,
): IAutoMovieRenderModeHandle => {
  const handle: IAutoMovieRenderSemanticMaskHandle = AutoMovieRenderSemanticMask.apply({
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
    restore: restoreRenderModeOnce(handle.restore),
  };
};
