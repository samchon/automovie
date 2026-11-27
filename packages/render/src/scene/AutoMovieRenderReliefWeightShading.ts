import type * as THREE from "three";
import type { IAutoMovieRenderMaterialShaderSource } from "./IAutoMovieRenderMaterialShaderSource";
import { applyReliefWeights as applyReliefWeightsImplementation } from "./reliefWeightShading/internal/applyReliefWeights";
import { reliefWeightVertex as reliefWeightVertexImplementation } from "./reliefWeightShading/internal/reliefWeightVertex";
import { reliefWeightFragment as reliefWeightFragmentImplementation } from "./reliefWeightShading/internal/reliefWeightFragment";
import { createReliefWeightShaderPatch as createReliefWeightShaderPatchImplementation } from "./reliefWeightShading/internal/createReliefWeightShaderPatch";

/** Public operations for Auto Movie Render Relief Weight Shading. */
export namespace AutoMovieRenderReliefWeightShading {
  /** One relief-weight shader operation registered on a material. */
  export type IShaderPatch = {
    /** Stable program-cache contribution for this operation. */
    key: string;
    /** Adds relief interpolation and normal modulation to this shader. */
    apply: (
      /** The source and uniform cells this patch mutates in place. */
      shader: Pick<IAutoMovieRenderMaterialShaderSource, "vertexShader" | "fragmentShader" | "uniforms">,
    ) => void;
  };

  /** Create the compile-hook operation that applies relief-weight shader changes. */
  export const createShaderPatch: () => IShaderPatch = (): IShaderPatch =>
    createReliefWeightShaderPatchImplementation();

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
