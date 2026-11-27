import * as THREE from "three";

import type { IMaterialShaderSource } from "../../IMaterialShaderSource.js";
import { AutoMovieRenderMaterial } from "../../AutoMovieRenderMaterial.js";
import type { IMaterialOverlayShading } from "../../IMaterialOverlayShading.js";
import type { IMaterialOverlayShape } from "../../IMaterialOverlayShape.js";
import { getOverlayFlatNormal } from "./getOverlayFlatNormal.js";
import { materialOverlayFragment } from "./materialOverlayFragment.js";
import { materialOverlayVertex } from "./materialOverlayVertex.js";

/*
 * Compose overlays in order, with coverage equal to image alpha times strength.
 * Linear colour factors modify each image before multiply tint or replacement
 * of the base colour; optional roughness mixes by the same coverage.
 *
 * A tint normal's xy slopes scale by normalScale times strength and combine
 * with the existing tangent normal by whiteout blending; this branch does not
 * use color alpha and retains the sampled z factor even at zero strength.
 * Replacement normals mix by alpha-times-strength coverage. A supplied normal
 * on a material without one adds the shared conventional flat map to provide a
 * tangent frame. These formulas do not establish measured tissue response or
 * observed appearance.
 */
export const applyMaterialOverlays: (
  material: THREE.MeshPhysicalMaterial,
  overlays: readonly IMaterialOverlayShading[],
) => void = (
  material: THREE.MeshPhysicalMaterial,
  overlays: readonly IMaterialOverlayShading[],
): void => {
  if (overlays.length === 0) return;
  if (
    material.normalMap === null &&
    overlays.some((o: IMaterialOverlayShading): boolean => o.normal !== null)
  ) {
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
  const shapes: IMaterialOverlayShape[] = overlays.map(
    (overlay: IMaterialOverlayShading): IMaterialOverlayShape => ({
      blend: overlay.blend,
      roughness: overlay.roughness !== null,
      normal: overlay.normal !== null,
    }),
  );
  AutoMovieRenderMaterial.addShaderPatch(material, {
    key: `automovie-overlays-${shapes
      .map(
        (shape: IMaterialOverlayShape): string =>
          `${shape.blend[0]}${shape.roughness ? "r" : ""}${shape.normal ? "n" : ""}`,
      )
      .join(".")}`,
    apply: (shader: IMaterialShaderSource): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = materialOverlayVertex(shader.vertexShader, shapes);
      shader.fragmentShader = materialOverlayFragment(
        shader.fragmentShader,
        shapes,
      );
    },
  });
};
