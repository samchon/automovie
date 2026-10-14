import type * as THREE from "three";

import { releaseViewerRenderer } from "./releaseViewerRenderer.js";
import { resetAutoMovieSceneShadowTargets } from "./resetAutoMovieSceneShadowTargets.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * End a mounted loop, its native scene shadow products and owned renderer. Stop scheduling first; shadow retirement still needs the live renderer's context before renderer disposal. Geometry/materials remain caller-owned. These owners release independently even when another listener fails. The shadow owner enforces its exclusive-context and external-borrower boundary.
 *
 * @evidence contracts/common.md#principled-implementation Attempts loop stop first, scene shadow retirement with the still-live renderer second and independent renderer/compositor release last, preserving every failure.
 * @evidence contracts/common.md#clear-and-simple-design One mount lifecycle composition uses existing shadow and renderer owners rather than duplicating their resource collections.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed earlier listener cannot skip later owners, borrowed geometry/materials are not disposed and public cleanup completion is not independent OS/GPU kernel settlement proof.
 * @evidence contracts/common.md#meaningful-documentation Documents shutdown ordering, borrowed model ownership, shadow exclusive-context/external-borrower boundary and independent failure handling.
 * @evidence contracts/performance.md#efficient-algorithms Fixed owner coordination delegates scene shadow traversal and distinct target retirement plus fixed compositor/renderer disposal; it adds no per-pixel work.
 * @evidence contracts/performance.md#reuse-equivalent-work The mount terminal guard owns one sticky shutdown attempt; this lower-level release composition itself performs requested cleanup rather than memoizing arbitrary repeated native disposal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No new resource is acquired; scheduling withdrawal precedes resource release, each owner gets an attempt and failure remains explicit rather than certifying freed native storage.
 */
export const releaseMountedViewer: (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  stopLoop: () => void,
) => void = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  stopLoop: () => void,
): void =>
  restoreAutoMovieRenderModeState([
    stopLoop,
    (): void => {
      resetAutoMovieSceneShadowTargets(scene, renderer);
    },
    (): void => {
      releaseViewerRenderer(renderer);
    },
  ]);
