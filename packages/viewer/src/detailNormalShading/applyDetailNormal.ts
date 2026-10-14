import type * as THREE from "three";
import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import { createDetailNormalShaderPatch } from "./createDetailNormalShaderPatch.js";

/**
 * Blend a second tangent-space normal map over a material's normal map: the
 * detail map is sampled over the first UV set through its own texture
 * transform, its slopes scaled by `scale`, and the two combined by whiteout
 * blending, `normalize(vec3(n1.xy + n2.xy, n1.z * n2.z))`, so a fine relief
 * tiled over a coarser one keeps both. The material must already carry a
 * tangent-space `normalMap`.
 *
 * @evidence contracts/common.md#principled-implementation Registers whiteout tangent-normal composition over an existing tangent-space normal map using the first UV set and the detail binding's captured transform/scale; usable UVs, finite admitted scale and nondegenerate decoded normals are premises, and this is an artistic relief blend rather than a geometric surface reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design Keeps detail-feature metadata beside one canonical shader patch and delegates ordered native hook/key installation to addMaterialShaderPatch; texture acquisition/lifetime stays with its resolver owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual texture/scale and the native compile extension point with no fixture normal values or replaced foreign shader method; base-normal absence is handled by buildMaterial before calling this two-map feature.
 * @evidence contracts/common.md#meaningful-documentation States tangent-space base-map requirement, transformed first UV, slope scale and exact whiteout formula; captured patch documents transform immutability after registration.
 * @evidence contracts/performance.md#efficient-algorithms Registration copies one texture matrix and appends one patch to the material's small list; compiled shader adds one detail texture sample plus constant vector arithmetic per fragment, with source-edit work linear in shader length.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses caller-owned detail texture and the material's existing base map, with one captured matrix/uniform set per registration; changing texture transform later requires a new patch rather than silently mutating the captured uniform.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Material metadata/patch closure retain the borrowed texture and captured scale/matrix through material lifetime; this feature acquires no independent GPU texture or task, and resolver/material owners must retire their respective resources.
 */
export const applyDetailNormal: (material: THREE.MeshPhysicalMaterial, texture: THREE.Texture, scale: number) => void = (
  material: THREE.MeshPhysicalMaterial,
  texture: THREE.Texture,
  scale: number,
): void => {
  const patch: { key: string; apply: (shader: Pick<THREE.WebGLProgramParametersWithUniforms, "vertexShader" | "fragmentShader" | "uniforms">) => void; } = createDetailNormalShaderPatch(texture, scale);
  material.userData.detailNormal = { texture, scale };
  addMaterialShaderPatch(material, patch);
};
