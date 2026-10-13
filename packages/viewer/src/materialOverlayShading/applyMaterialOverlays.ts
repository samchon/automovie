import * as THREE from "three";
import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import type { IMaterialOverlayShading } from "./IMaterialOverlayShading.js";
import { getOverlayFlatNormal } from "./getOverlayFlatNormal.js";
import { materialOverlayVertex } from "./materialOverlayVertex.js";
import { materialOverlayFragment } from "./materialOverlayFragment.js";

/**
 * Composite surface overlays over a material, in order, each where its own
 * colour image covers, its colour times its colour factor: its coverage is
 * the image's alpha times its strength,
 * over which the base colour is multiplied by the image's colour (`multiply`)
 * or replaced by it (`replace`), the roughness moves to the overlay's own
 * when it names one, and its normal map, scaled by its normal scale, bends
 * the tangent-space normal: a tint's slopes, times its strength too, add to
 * the material's by whiteout blending, and a replacing layer's normal
 * replaces the material's by its coverage, as another tissue's surface
 * does. An overlay with a
 * normal map on a material without one gives the material a flat normal map,
 * so the tangent frame it bends exists.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves a material's surface overlays into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the overlay composite at the render boundary.
 */
export const applyMaterialOverlays = (
  material: THREE.MeshPhysicalMaterial,
  overlays: readonly IMaterialOverlayShading[],
): void => {
  if (overlays.length === 0) return;
  if (material.normalMap === null && overlays.some((o) => o.normal !== null)) {
    material.normalMap = getOverlayFlatNormal();
    material.userData.autoMovieOverlayFlatNormal = material.normalMap;
  }
  const uniforms: Record<string, THREE.IUniform> = {};
  overlays.forEach((overlay, i) => {
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
  const shapes = overlays.map((overlay) => ({
    blend: overlay.blend,
    roughness: overlay.roughness !== null,
    normal: overlay.normal !== null,
  }));
  addMaterialShaderPatch(material, {
    key: `automovie-overlays-${shapes
      .map(
        (shape) =>
          `${shape.blend[0]}${shape.roughness ? "r" : ""}${shape.normal ? "n" : ""}`,
      )
      .join(".")}`,
    apply: (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = materialOverlayVertex(shader.vertexShader, shapes);
      shader.fragmentShader = materialOverlayFragment(
        shader.fragmentShader,
        shapes,
      );
    },
  });
};

