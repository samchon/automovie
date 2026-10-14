import * as THREE from "three";

import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import { getSubsurfaceTexture } from "./getSubsurfaceTexture.js";
import { subsurfaceFragment } from "./subsurfaceFragment.js";

/**
 * Register the existing direct-diffuse subsurface shader approximation on a new physical material, borrowing one shared lookup texture. Radius channels are admitted nonnegative finite distances in metres by Engine validation; this helper does not independently validate them or prove measured tissue response.
 *
 * @evidence contracts/common.md#principled-implementation Captures per-material RGB radius uniforms and registers the table lookup/curvature source patch through public Three compile hooks; the supported physical chunk and Engine-admitted material are required premises.
 * @evidence contracts/common.md#clear-and-simple-design Uniform setup, shared table production and shader rewriting retain separate existing owners; the material keeps the subsurface texture role visible in userData.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomical fitted output, foreign-method replacement or runtime shader-registry patch is used; screen-space curvature and tabulated Gaussian response remain a rendering approximation requiring actual beauty observation.
 * @evidence contracts/common.md#meaningful-documentation States radius units/admission owner, shared texture borrowing, direct-diffuse scope and visual/scientific limits.
 * @evidence contracts/performance.md#efficient-algorithms Fixed uniform setup delegates first-use table quadrature and O(shader length) compile rewriting; normal material construction registers only its current small feature set.
 * @evidence contracts/performance.md#reuse-equivalent-work All materials borrow the same immutable lookup wrapper while each radius uniform stays independent; Three program reuse depends on the structural patch key, not equality of captured radius values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Material hooks/userData retain radius and the borrowed texture until material references disappear; lookup storage has module lifetime with no explicit retirement API, and this helper acquires no program itself.
 */
export function applySubsurfaceShading(
  material: THREE.MeshPhysicalMaterial,
  radius: { r: number; g: number; b: number },
): void {
  const radiusUniform: { value: THREE.Vector3 } = {
    value: new THREE.Vector3(radius.r, radius.g, radius.b),
  };
  const tableUniform: { value: THREE.DataTexture } = {
    value: getSubsurfaceTexture(),
  };
  material.userData.autoMovieSubsurfaceTexture = tableUniform.value;
  material.userData.subsurfaceRadius = { ...radius };
  addMaterialShaderPatch(material, {
    key: "automovie-subsurface",
    apply: (shader: THREE.WebGLProgramParametersWithUniforms): void => {
      shader.uniforms.subsurfaceRadius = radiusUniform;
      shader.uniforms.subsurfaceTable = tableUniform;
      shader.fragmentShader = subsurfaceFragment(shader.fragmentShader);
    },
  });
}
