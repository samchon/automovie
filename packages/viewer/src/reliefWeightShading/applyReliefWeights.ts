import type * as THREE from "three";
import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import { createReliefWeightShaderPatch } from "./createReliefWeightShaderPatch.js";

/**
 * Scale a material's normal-map slopes by each vertex's relief weight (the mesh's `reliefWeight` attribute, interpolated across the triangle), before any detail map or overlay blends in, so a relief deepens or flattens across the surface while the finer detail stays even. The material must carry a tangent-space `normalMap`, and every mesh drawn with it must carry the attribute.
 *
 * @evidence contracts/common.md#principled-implementation Registers the existing stable-key shader patch that interpolates per-vertex relief and scales native tangent normal slopes before downstream detail/overlay composition.
 * @evidence contracts/common.md#clear-and-simple-design Patch registration uses the common material compile-hook owner while vertex and fragment source transformations stay separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every drawn mesh must provide reliefWeight and a tangent-space normalMap; no fallback attribute or changed shader value hides a missing input, and registration alone is not appearance proof.
 * @evidence contracts/common.md#meaningful-documentation Documents attribute interpolation, base slope weighting order, tangent-normal premise and required per-mesh attribute.
 * @evidence contracts/performance.md#efficient-algorithms Registration adds one fixed patch descriptor; actual compile transformations scan shader source and runtime weighting stays native per-fragment work.
 * @evidence contracts/performance.md#reuse-equivalent-work The stable patch key contributes to native program equivalence while per-mesh attributes remain live inputs; no compiled program is cached independently here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The material compile owner retains the registered descriptor with that material, whose caller owns disposal; no geometry, texture or WebGL program is acquired by registration.
 */
export const applyReliefWeights: (material: THREE.Material) => void = (material: THREE.Material): void => {
  addMaterialShaderPatch(material, createReliefWeightShaderPatch());
};
