import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";
import type * as THREE from "three";

/**
 * Describe Three r186's next native map or VSM blur attachment factory.
 * WebGLShadowMap multiplies mapSize by public frame extents and clamps each
 * viewport to floor(maxTextureSize / extent). Point cubes use the resulting
 * x-edge for both dimensions and six faces, regardless of mapSize.y.
 * Its PCF map constructor retains default RGBA8 color plus unsigned-int depth;
 * VSM requests RG half-float color plus float depth. The VSM blur target uses
 * RG half-float color and the default D24 renderbuffer. These are constructor
 * representation facts, not a second texture byte or allocation-count formula.
 * The caller admits point/filter compatibility through the Engine profile.
 * This creates no target and does not mutate the light's requested mapSize.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies native shadow factory representation and bounded extents before first allocation.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Labels unallocated required map and blur products without calling their bounds observed GPU residency.
 */
export const planAutoMovieShadowTextureTarget = (
  scope: string,
  light: string,
  shadow: THREE.LightShadow,
  point: boolean,
  filter: "pcf" | "vsm",
  role: "map" | "blur",
  maxTextureSize: number,
): IAutoMovieRenderTextureTarget => {
  const extents = shadow.getFrameExtents();
  const width = Math.floor(Math.min(shadow.mapSize.x, Math.floor(maxTextureSize / extents.x)) * extents.x);
  const height = point ? width : Math.floor(Math.min(shadow.mapSize.y, Math.floor(maxTextureSize / extents.y)) * extents.y);
  return {
    owner: `shadow-target:${JSON.stringify([scope, light, role, "planned"])}`,
    shadow: { scope, light, role }, width, height, faces: point ? 6 : 1,
    formats: [filter === "vsm" ? "rg16f" : "rgba8"],
    mipmapped: false, samples: 0, depthBytesPerTexel: 4,
    depthTexture: role === "map",
  };
};
