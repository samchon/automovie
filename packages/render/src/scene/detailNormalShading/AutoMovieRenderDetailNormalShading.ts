import type * as THREE from "three";
import type { IMaterialShaderSource } from "../IMaterialShaderSource.js";
import { applyDetailNormal as applyDetailNormalImplementation } from "./internal/applyDetailNormal.js";
import { detailNormalVertex as detailNormalVertexImplementation } from "./internal/detailNormalVertex.js";
import { detailNormalFragment as detailNormalFragmentImplementation } from "./internal/detailNormalFragment.js";
import { spliceTangentNormal as spliceTangentNormalImplementation } from "./internal/spliceTangentNormal.js";
import { createDetailNormalShaderPatch as createDetailNormalShaderPatchImplementation } from "./internal/createDetailNormalShaderPatch.js";

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
   * One captured detail-normal compile operation.
   */
  export type IShaderPatch = {
    /** Stable program-cache contribution for this operation. */
    key: string;
    /** Edits source and uniforms using the captured texture transform and scale. */
    apply: (
      /** The source and uniform cells this patch mutates in place. */
      shader: Pick<IMaterialShaderSource, "vertexShader" | "fragmentShader" | "uniforms">,
    ) => void;
  };

  /** Capture one texture transform and scale for registration on a material. */
  export const createShaderPatch: (
    texture: THREE.Texture,
    scale: number,
  ) => IShaderPatch = (
    texture: THREE.Texture,
    scale: number,
  ): IShaderPatch => createDetailNormalShaderPatchImplementation(texture, scale);

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
