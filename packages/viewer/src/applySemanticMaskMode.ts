import * as THREE from "three";
import {type IAutoMovieSemanticMaskBinding, type IAutoMovieSemanticMaskHandle, applyAutoMovieSemanticMask} from "./semanticMask/index.js";
import type {IAutoMovieRenderModeHandle} from "./IAutoMovieRenderModeHandle.js";

import {restoreAutoMovieRenderModeOnce} from "./restoreAutoMovieRenderModeOnce.js";

/**
 * Mask pass over the stable semantic palette the scene was handed.
 *
 * The outer pass boundary suspends fog, image lighting, background and non-mesh
 * renderables. {@link applyAutoMovieSemanticMask} snapshots those already
 * suspended values for its own install. Inner restoration returns the outer
 * boundary's black background and suspended state, then outer restoration
 * returns the original background, atmosphere and helper visibility. Coverage counts scene
 * membership and palette resolution, not visible or rasterized pixels.
 *
 * @evidence contracts/common.md#principled-implementation Applies the attached portable semantic design/palette through its canonical scene mapper and forwards painted/unaddressed/unresolved scene-membership coverage; valid admitted design/id ownership is the mapper's premise. Counts do not prove visibility/frustum/pixel coverage, and no child-index palette substitutes for a semantic identity.
 * @evidence contracts/common.md#clear-and-simple-design Adapts the semantic mask owner's result into the common render-mode handle, leaving scene admission/material replacement and coverage computation with applyAutoMovieSemanticMask.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the supplied real semantic palette and actual coverage without fixture ids or generated success counts; nested scene suspensions restore exact prior state rather than resetting arbitrary defaults.
 * @evidence contracts/common.md#meaningful-documentation Gives stable semantic-palette purpose, nested suspension ordering and returned coverage/restore ownership instead of claiming rendered success from presence of a binding.
 * @evidence contracts/performance.md#efficient-algorithms Adds constant-size handle/coverage wrapping to the mapper's entity/scene/material traversal, preserving its dominant costs and temporary resource population rather than moving them out of the accounting.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses canonical semantic mapping and one mapper restore completion per install; nested snapshot scopes keep independent prior states and cannot share a cached restoration by scene identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows scene/binding and forwards the mapper-owned reversible resources through a memoized closer; no independent renderer, texture or task is acquired by this adapter, and actual native retirement remains the mapper/host boundary.
 */
export const applySemanticMaskMode: (scene: THREE.Scene, binding: IAutoMovieSemanticMaskBinding) => IAutoMovieRenderModeHandle = (
  scene: THREE.Scene,
  binding: IAutoMovieSemanticMaskBinding,
): IAutoMovieRenderModeHandle => {
  const handle: IAutoMovieSemanticMaskHandle = applyAutoMovieSemanticMask({
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
