import * as THREE from "three";

import type { IAutoMovieRenderMaterialShaderSource } from "../../IAutoMovieRenderMaterialShaderSource";
import { AutoMovieRenderMaterial } from "../../AutoMovieRenderMaterial";
import { getSubsurfaceTexture } from "./getSubsurfaceTexture";
import { subsurfaceFragment } from "./subsurfaceFragment";

/*
 * Register the existing direct-diffuse subsurface shader approximation on a new
 * physical material, borrowing one shared lookup texture. Radius channels are
 * admitted nonnegative finite distances in metres by Engine validation; this
 * helper does not independently validate them or prove measured tissue
 * response.
 */
export function applySubsurfaceShadingImplementation(
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
    apply: (shader: IAutoMovieRenderMaterialShaderSource): void => {
      shader.uniforms.subsurfaceRadius = radiusUniform;
      shader.uniforms.subsurfaceTable = tableUniform;
      shader.fragmentShader = subsurfaceFragment(shader.fragmentShader);
    },
  });
}
