import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";
import * as THREE from "three";

/**
 * Bound the r186 scene/camera transmission target from the current host state. The native factory uses the physical viewport times transmission scale, a half-float color attachment when supported, full mips and at least four requested samples. D24/D24S8 depth is bounded by four bytes per sample. This is a conservative factory profile, not a driver allocation measurement. The host retains one record per live native scene/camera target, including earlier cameras whose cache survives material removal, until context release.
 *
 * @evidence contracts/common.md#principled-implementation Uses a truthy native camera viewport or current physical renderer viewport, resolution scale and actual half-float extensions/sample capability to bound the installed transmission factory.
 * @evidence contracts/common.md#clear-and-simple-design One prospective scene/camera factory profile supplies Engine accounting while actual native target allocation and host retention remain outside this helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed structural extents remain NaN for downstream admission instead of an invented size; scale/sample metadata and supported extensions do not prove a current driver allocation.
 * @evidence contracts/common.md#meaningful-documentation Documents viewport scaling, floor-to-pixels, color capability fallback, full mips, minimum four samples, depth bound and retained earlier-camera ownership.
 * @evidence contracts/performance.md#efficient-algorithms Fixed viewport/component/extension reads and one Vector4 scratch allocate no pixel arrays or transmission target.
 * @evidence contracts/performance.md#reuse-equivalent-work The current camera/host profile must be observed after viewport or capability changes; an earlier camera row cannot replace a different retained scene/camera target.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned scalar metadata acquires no framebuffer; caller retains each live native scene/camera target profile, including removed-material histories, until actual context/target release.
 */
export function readAutoMovieTransmissionTextureTarget(
  owner: string,
  transmissionScope: string,
  renderer: {
    getCurrentViewport: THREE.WebGLRenderer["getCurrentViewport"];
    transmissionResolutionScale: number;
    capabilities: Pick<THREE.WebGLRenderer["capabilities"], "samples">;
    extensions: Pick<THREE.WebGLRenderer["extensions"], "has">;
  },
  camera: THREE.Camera,
): IAutoMovieRenderTextureTarget {
  const viewport: unknown = ("viewport" in camera ? camera.viewport : undefined) ||
    renderer.getCurrentViewport(new THREE.Vector4());
  const width: number = typeof viewport === "object" && viewport !== null && "z" in viewport && typeof viewport.z === "number" ? viewport.z : NaN;
  const height: number = typeof viewport === "object" && viewport !== null && "w" in viewport && typeof viewport.w === "number" ? viewport.w : NaN;
  const half: boolean = renderer.extensions.has("EXT_color_buffer_half_float") ||
    renderer.extensions.has("EXT_color_buffer_float");
  return { owner, transmissionScope,
    width: Math.floor(width * renderer.transmissionResolutionScale),
    height: Math.floor(height * renderer.transmissionResolutionScale),
    formats: [half ? "rgba16f" : "rgba8"], mipmapped: true,
    samples: Math.max(4, renderer.capabilities.samples), depthBytesPerTexel: 4, depthTexture: false,
  };
}
