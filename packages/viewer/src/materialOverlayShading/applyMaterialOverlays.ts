import * as THREE from "three";
import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import type { IMaterialOverlayShading } from "./IMaterialOverlayShading.js";
import type { IMaterialOverlayShape } from "./IMaterialOverlayShape.js";
import { getOverlayFlatNormal } from "./getOverlayFlatNormal.js";
import { materialOverlayVertex } from "./materialOverlayVertex.js";
import { materialOverlayFragment } from "./materialOverlayFragment.js";

/**
 * Compose overlays in order, with coverage equal to image alpha times strength. Linear colour factors modify each image before multiply tint or replacement of the base colour; optional roughness mixes by the same coverage.
 *
 * A tint normal's xy slopes scale by normalScale times strength and combine with the existing tangent normal by whiteout blending; this branch does not use color alpha and retains the sampled z factor even at zero strength. Replacement normals mix by alpha-times-strength coverage. A supplied normal on a material without one adds the shared conventional flat map to provide a tangent frame. These formulas do not establish measured tissue response or observed appearance.
 *
 * @evidence contracts/common.md#principled-implementation Registers ordered color/roughness and replacement-normal coverage by alpha times strength. Multiply normals instead use strength-scaled xy and the sampled z in whiteout, ignoring alpha and potentially changing an existing normal at zero strength. Public compile hooks add the shared conventional flat normal when a tangent frame is required.
 * @evidence contracts/common.md#clear-and-simple-design Uniform values stay material-local while structural overlay shapes select shared vertex/fragment generators and their program key.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Texture transforms and order are preserved, no SDK prototype/internal is replaced and registration assumes the existing buildMaterial precompile phase rather than patching a compiled material silently.
 * @evidence contracts/common.md#meaningful-documentation Documentation describes blend/coverage/normal semantics, optional roughness and the flat-normal prerequisite without claiming an observed material appearance.
 * @evidence contracts/performance.md#efficient-algorithms For L layers, uniform/shapes/key construction is O(L); shader expansion and actual per-pixel texture samples grow with enabled layer components.
 * @evidence contracts/performance.md#reuse-equivalent-work Ordered blend/roughness/normal shapes identify program-source equivalence while colour/normal texture transforms and scalar uniforms remain distinct per material.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The material and its patch closure retain O(L) overlay/uniform references until material release; textures are borrowed, the flat normal is one module singleton and this helper has no layer-count cap or unregister API.
 */
export const applyMaterialOverlays: (material: THREE.MeshPhysicalMaterial, overlays: readonly IMaterialOverlayShading[]) => void = (
  material: THREE.MeshPhysicalMaterial,
  overlays: readonly IMaterialOverlayShading[],
): void => {
  if (overlays.length === 0) return;
  if (material.normalMap === null && overlays.some((o: IMaterialOverlayShading): boolean => o.normal !== null)) {
    material.normalMap = getOverlayFlatNormal();
    material.userData.autoMovieOverlayFlatNormal = material.normalMap;
  }
  const uniforms: Record<string, THREE.IUniform> = {};
  overlays.forEach((overlay: IMaterialOverlayShading, i: number): void => {
    overlay.color.updateMatrix();
    uniforms[`overlayColorMap${i}`] = { value: overlay.color };
    uniforms[`overlayColorTransform${i}`] = {
      value: overlay.color.matrix.clone(),
    };
    uniforms[`overlayStrength${i}`] = { value: overlay.strength };
    uniforms[`overlayColorFactor${i}`] = {
      value: new THREE.Vector3(
        overlay.colorFactor.r,
        overlay.colorFactor.g,
        overlay.colorFactor.b,
      ),
    };
    if (overlay.roughness !== null)
      uniforms[`overlayRoughness${i}`] = { value: overlay.roughness };
    if (overlay.normal !== null) {
      overlay.normal.updateMatrix();
      uniforms[`overlayNormalMap${i}`] = { value: overlay.normal };
      uniforms[`overlayNormalTransform${i}`] = {
        value: overlay.normal.matrix.clone(),
      };
      uniforms[`overlayNormalScale${i}`] = { value: overlay.normalScale };
    }
  });
  material.userData.overlays = overlays;
  const shapes: IMaterialOverlayShape[] = overlays.map((overlay: IMaterialOverlayShading): IMaterialOverlayShape => ({
    blend: overlay.blend,
    roughness: overlay.roughness !== null,
    normal: overlay.normal !== null,
  }));
  addMaterialShaderPatch(material, {
    key: `automovie-overlays-${shapes
      .map(
        (shape: IMaterialOverlayShape): string =>
          `${shape.blend[0]}${shape.roughness ? "r" : ""}${shape.normal ? "n" : ""}`,
      )
      .join(".")}`,
    apply: (shader: THREE.WebGLProgramParametersWithUniforms): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = materialOverlayVertex(shader.vertexShader, shapes);
      shader.fragmentShader = materialOverlayFragment(
        shader.fragmentShader,
        shapes,
      );
    },
  });
};

