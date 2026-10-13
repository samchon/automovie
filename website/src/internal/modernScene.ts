/**
 * Typed website boundary onto the modern production's shared native uploader. The production inspector and website now call the same mesh, mirror, light and material implementation. The public house tour requires its physical lighting record; the native inspector also supports calibration fallbacks.
 */
import { buildScene } from "modern-suburban-house/viewer/scene";
import type * as THREE from "three";
import type { ModernPayload } from "../ModernPayload";

/** Requires the house's authored physical lighting before delegating to its native scene uploader with that lighting's fixed exposure. */
export const modernScene: (payload: ModernPayload, textures: Map<string, THREE.Texture>) => THREE.Scene = (
  payload: ModernPayload,
  textures: Map<string, THREE.Texture>,
): THREE.Scene => {
  if (!payload.physicalLighting)
    throw new Error("The modern house is missing its authored lighting.");
  return buildScene(payload, textures, {
    toneMappingExposure: payload.physicalLighting.environment.exposure,
  });
};
