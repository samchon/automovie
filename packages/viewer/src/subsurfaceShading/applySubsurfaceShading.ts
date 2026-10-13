import * as THREE from "three";
import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import { getSubsurfaceTexture } from "./getSubsurfaceTexture.js";
import { subsurfaceFragment } from "./subsurfaceFragment.js";

/**
 * Give a physical material the diffuse response of a translucent surface:
 * each primary's direct diffuse term reads the pre-integrated table at the
 * cosine of the light and at the blur its mean free path reaches on the
 * surface's curvature, estimated per fragment from the screen-space change
 * of the interpolated normal over the change of the view position. A flat
 * surface keeps the clamped cosine; a curved one bleeds soft and red past
 * the terminator. Specular, clearcoat and indirect light are untouched.
 */
export const applySubsurfaceShading = (
  material: THREE.MeshPhysicalMaterial,
  radius: { r: number; g: number; b: number },
): void => {
  const radiusUniform = {
    value: new THREE.Vector3(radius.r, radius.g, radius.b),
  };
  const tableUniform = { value: getSubsurfaceTexture() };
  material.userData.autoMovieSubsurfaceTexture = tableUniform.value;
  material.userData.subsurfaceRadius = { ...radius };
  addMaterialShaderPatch(material, {
    key: "automovie-subsurface",
    apply: (shader) => {
      shader.uniforms.subsurfaceRadius = radiusUniform;
      shader.uniforms.subsurfaceTable = tableUniform;
      shader.fragmentShader = subsurfaceFragment(shader.fragmentShader);
    },
  });
};

