import * as THREE from "three";

import type { IMaterialShaderSource } from "../IMaterialShaderSource.js";
import { AutoMovieRenderMaterial } from "../AutoMovieRenderMaterial.js";
import { getSubsurfaceTexture } from "./getSubsurfaceTexture.js";
import { subsurfaceFragment } from "./internal/subsurfaceFragment.js";

/**
 * Register the existing direct-diffuse subsurface shader approximation on a new
 * physical material, borrowing one shared lookup texture. Radius channels are
 * admitted nonnegative finite distances in metres by Engine validation; this
 * helper does not independently validate them or prove measured tissue
 * response.
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
  AutoMovieRenderMaterial.addShaderPatch(material, {
    key: "automovie-subsurface",
    apply: (shader: IMaterialShaderSource): void => {
      shader.uniforms.subsurfaceRadius = radiusUniform;
      shader.uniforms.subsurfaceTable = tableUniform;
      shader.fragmentShader = subsurfaceFragment(shader.fragmentShader);
    },
  });
}
