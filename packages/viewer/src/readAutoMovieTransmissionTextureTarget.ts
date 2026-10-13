import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";
import * as THREE from "three";

/**
 * Bound the r186 scene/camera transmission target from the current host state.
 * The native factory uses the physical viewport times transmission scale, a
 * half-float color attachment when supported, full mips and at least four
 * requested samples. D24/D24S8 depth is bounded by four bytes per sample.
 * This is a conservative factory profile, not a driver allocation measurement.
 * The host retains one record per live native scene/camera target, including
 * earlier cameras whose cache survives material removal, until context release.
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
  const viewport = ("viewport" in camera ? camera.viewport : undefined) ||
    renderer.getCurrentViewport(new THREE.Vector4());
  const width = typeof viewport === "object" && "z" in viewport && typeof viewport.z === "number" ? viewport.z : NaN;
  const height = typeof viewport === "object" && "w" in viewport && typeof viewport.w === "number" ? viewport.w : NaN;
  const half = renderer.extensions.has("EXT_color_buffer_half_float") ||
    renderer.extensions.has("EXT_color_buffer_float");
  return { owner, transmissionScope,
    width: Math.floor(width * renderer.transmissionResolutionScale),
    height: Math.floor(height * renderer.transmissionResolutionScale),
    formats: [half ? "rgba16f" : "rgba8"], mipmapped: true,
    samples: Math.max(4, renderer.capabilities.samples), depthBytesPerTexel: 4, depthTexture: false,
  };
}
