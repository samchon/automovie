import type * as THREE from "three";
import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import { createReliefWeightShaderPatch } from "./createReliefWeightShaderPatch.js";

/**
 * Scale a material's normal-map slopes by each vertex's relief weight (the
 * mesh's `reliefWeight` attribute, interpolated across the triangle), before
 * any detail map or overlay blends in, so a relief deepens or flattens
 * across the surface while the finer detail stays even. The material must
 * carry a tangent-space `normalMap`, and every mesh drawn with it must carry
 * the attribute.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves a mesh's per-vertex relief strength into its render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the per-vertex normal-map strength at the render boundary.
 */
export const applyReliefWeights = (material: THREE.Material): void => {
  addMaterialShaderPatch(material, createReliefWeightShaderPatch());
};
