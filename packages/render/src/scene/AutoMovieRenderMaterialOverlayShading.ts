import type * as THREE from "three";
import { type IMaterialOverlayShading } from "./IMaterialOverlayShading.js";
import { applyMaterialOverlays as applyMaterialOverlaysImplementation } from "./materialOverlayShading/internal/applyMaterialOverlays.js";
import { type IMaterialOverlayShape } from "./IMaterialOverlayShape.js";
import { materialOverlayVertex as materialOverlayVertexImplementation } from "./materialOverlayShading/internal/materialOverlayVertex.js";
import { materialOverlayFragment as materialOverlayFragmentImplementation } from "./materialOverlayShading/internal/materialOverlayFragment.js";

/** Public operations for Auto Movie Render Material Overlay Shading. */
export namespace AutoMovieRenderMaterialOverlayShading {
  /**
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
  export function apply(material: THREE.MeshPhysicalMaterial, overlays: readonly IMaterialOverlayShading[]): void {
    applyMaterialOverlaysImplementation(material, overlays);
  }

  /** The vertex shader passing each overlay image's transformed UV. */
  export function vertex(vertexShader: string, shapes: readonly IMaterialOverlayShape[]): string {
    return materialOverlayVertexImplementation(vertexShader, shapes);
  }

  /** The fragment shader compositing each overlay's colour, roughness and slopes. */
  export function fragment(fragmentShader: string, shapes: readonly IMaterialOverlayShape[]): string {
    return materialOverlayFragmentImplementation(fragmentShader, shapes);
  }
}
