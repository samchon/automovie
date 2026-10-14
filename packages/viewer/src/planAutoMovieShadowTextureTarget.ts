import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";
import type * as THREE from "three";

/**
 * Describe Three r186's next native map or VSM blur attachment factory. WebGLShadowMap multiplies mapSize by public frame extents and clamps each viewport to floor(maxTextureSize / extent). Point cubes use the resulting x-edge for both dimensions and six faces, regardless of mapSize.y. Its PCF map constructor retains default RGBA8 color plus unsigned-int depth; VSM requests RG half-float color plus float depth. The VSM blur target uses RG half-float color and the default D24 renderbuffer. These are constructor representation facts, not a second texture byte or allocation-count formula. The caller admits point/filter compatibility through the Engine profile. This creates no target and does not mutate the light's requested mapSize.
 *
 * @evidence contracts/common.md#principled-implementation Projects installed Three r186's public frame extents/mapSize clamp and native PCF/VSM constructors into representation metadata, with point cubes using the x edge and six faces.
 * @evidence contracts/common.md#clear-and-simple-design This planner supplies one required factory row while Engine profile admission and byte/accounting aggregation remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native target is allocated or light mapSize mutated, compatibility is admitted by the caller and constructor metadata is not a measured physical allocation count.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies the installed allocator family, depth/colour attachments, point dimensions and supported-profile premises.
 * @evidence contracts/performance.md#efficient-algorithms Fixed extent arithmetic and constructing one metadata row take constant work, independent of scene nodes or shadow pixel count.
 * @evidence contracts/performance.md#reuse-equivalent-work The retained-target comparator uses these exact planned representation facts to avoid a duplicate planned row only when current allocation metadata matches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Public shadow/capability facts are borrowed and the returned row owns no texture, framebuffer or depth attachment.
 */
export const planAutoMovieShadowTextureTarget: (scope: string, light: string, shadow: THREE.LightShadow, point: boolean, filter: "pcf" | "vsm", role: "map" | "blur", maxTextureSize: number) => IAutoMovieRenderTextureTarget = (
  scope: string,
  light: string,
  shadow: THREE.LightShadow,
  point: boolean,
  filter: "pcf" | "vsm",
  role: "map" | "blur",
  maxTextureSize: number,
): IAutoMovieRenderTextureTarget => {
  const extents: THREE.Vector2 = shadow.getFrameExtents();
  const width: number = Math.floor(Math.min(shadow.mapSize.x, Math.floor(maxTextureSize / extents.x)) * extents.x);
  const height: number = point ? width : Math.floor(Math.min(shadow.mapSize.y, Math.floor(maxTextureSize / extents.y)) * extents.y);
  return {
    owner: `shadow-target:${JSON.stringify([scope, light, role, "planned"])}`,
    shadow: { scope, light, role }, width, height, faces: point ? 6 : 1,
    formats: [filter === "vsm" ? "rg16f" : "rgba8"],
    mipmapped: false, samples: 0, depthBytesPerTexel: 4,
    depthTexture: role === "map",
  };
};
