import type * as THREE from "three";
import { applyDetailNormal as applyDetailNormalImplementation } from "./internal/applyDetailNormal.js";
import { detailNormalVertex as detailNormalVertexImplementation } from "./internal/detailNormalVertex.js";
import { detailNormalFragment as detailNormalFragmentImplementation } from "./internal/detailNormalFragment.js";
import { spliceTangentNormal as spliceTangentNormalImplementation } from "./internal/spliceTangentNormal.js";

/** Public operations for Auto Movie Render Detail Normal Shading. */
export namespace AutoMovieRenderDetailNormalShading {
  /**
   * Blend a second tangent-space normal map over a material's normal map: the
   * detail map is sampled over the first UV set through its own texture
   * transform, its slopes scaled by `scale`, and the two combined by whiteout
   * blending, `normalize(vec3(n1.xy + n2.xy, n1.z * n2.z))`, so a fine relief
   * tiled over a coarser one keeps both. The material must already carry a
   * tangent-space `normalMap`.
   */
  export function apply(material: THREE.MeshPhysicalMaterial, texture: THREE.Texture, scale: number): void {
    applyDetailNormalImplementation(material, texture, scale);
  }

  /**
   * Pass the detail map's own transformed first UV set to the fragment stage. The
   * caller supplies the native shader chunks and retains the input string.
   */
  export function vertex(vertexShader: string): string {
    return detailNormalVertexImplementation(vertexShader);
  }

  /**
   * Blend detail slopes into the base tangent-space normal by whiteout blending.
   * The shared splice owner expands the native chunk once and refuses a shader
   * with no supported tangent-space projection boundary.
   */
  export function fragment(fragmentShader: string): string {
    return detailNormalFragmentImplementation(fragmentShader);
  }

  /**
   * Insert code into the tangent-space branch of three's normal-map chunk, just
   * before the frame turns `mapN` into the normal, expanding the chunk first
   * unless an earlier patch already did, so patches that bend the tangent-space
   * normal compose in the order they run.
   */
  export function spliceTangentNormal(fragmentShader: string, code: string): string {
    return spliceTangentNormalImplementation(fragmentShader, code);
  }
}
