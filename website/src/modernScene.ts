/**
 * Typed website boundary onto the modern production's shared native uploader.
 * The production inspector and website now call the same mesh, mirror, light
 * and material implementation. The public house tour requires its physical
 * lighting record; the native inspector also supports calibration fallbacks.
 */
import { buildMesh, buildScene } from "modern-suburban-house/viewer/scene";
import type * as THREE from "three";

/**
 * The scene payload the production uploader accepts, read from its signature.
 * A relative import of the payload module would reach the production sources
 * by their real path, outside the test project root, and the test runner then
 * writes their compiled output beside them.
 */
export type ModernPayload = Parameters<typeof buildScene>[0];
export const modernMesh = buildMesh;
export const modernScene = (
  payload: ModernPayload,
  textures: Map<string, THREE.Texture>,
): THREE.Scene => {
  if (!payload.physicalLighting)
    throw new Error("The modern house is missing its authored lighting.");
  return buildScene(payload, textures, {
    toneMappingExposure: payload.physicalLighting.environment.exposure,
  });
};
