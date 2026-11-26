import type * as THREE from "three";
import { applyReliefWeights as applyReliefWeightsImplementation } from "./internal/applyReliefWeights.js";
import { reliefWeightVertex as reliefWeightVertexImplementation } from "./internal/reliefWeightVertex.js";
import { reliefWeightFragment as reliefWeightFragmentImplementation } from "./internal/reliefWeightFragment.js";

/** Public operations for Auto Movie Render Relief Weight Shading. */
export namespace AutoMovieRenderReliefWeightShading {
  /**
   * Scale a material's normal-map slopes by each vertex's relief weight (the
   * mesh's `reliefWeight` attribute, interpolated across the triangle), before
   * any detail map or overlay blends in, so a relief deepens or flattens across
   * the surface while the finer detail stays even. The material must carry a
   * tangent-space `normalMap`, and every mesh drawn with it must carry the
   * attribute.
   */
  export function apply(material: THREE.Material): void {
    applyReliefWeightsImplementation(material);
  }

  /**
   * Interpolate the mesh's reliefWeight attribute into the fragment stage. The
   * owning mesh supplies the attribute; this transformation adds no fallback
   * value that could conceal an absent per-vertex input.
   */
  export function vertex(vertexShader: string): string {
    return reliefWeightVertexImplementation(vertexShader);
  }

  /**
   * Multiply base normal-map slopes by interpolated relief after their native
   * scale. The native chunk is expanded only when still present; a shader with no
   * scale boundary is refused rather than leaving the material unmodified.
   */
  export function fragment(fragmentShader: string): string {
    return reliefWeightFragmentImplementation(fragmentShader);
  }
}
