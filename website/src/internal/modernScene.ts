/**
 * Website boundary onto the modern production's scene uploader. The public house tour requires authored physical lighting and delegates the mesh, mirror, light and material projection to that source implementation; its native inspector's module serving is a separate host boundary.
 */
import { buildScene } from "modern-suburban-house/viewer/scene";
import type * as THREE from "three";
import type { ModernPayload } from "../ModernPayload";

/**
 * Require the house's authored physical lighting before delegating to its native scene uploader with that lighting's fixed exposure. The caller owns decoded textures and final scene cleanup; a throwing native uploader owns any partially constructed resources it has not returned.
 *
 * @evidence contracts/common.md#principled-implementation The actual buildScene implementation receives its own payload type and texture map after physical-lighting presence is checked; it projects authored meshes/lights and exposure rather than using its calibration fallback.
 * @evidence contracts/common.md#clear-and-simple-design This thin website boundary enforces the public house lighting requirement while geometry and material projection remain in their existing production owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing physical lighting throws instead of substituting calibration lighting; the native function is called directly without replacement or copied mesh logic.
 * @evidence contracts/common.md#meaningful-documentation The comment states the lighting requirement, source delegation and scene/texture/partial-failure ownership.
 * @evidence contracts/performance.md#efficient-algorithms The guard is constant, followed by native work proportional to payload lights, mesh items and vertex/index data; the wrapper adds no duplicate geometry traversal or allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Caller-decoded textures and the native uploader implementation are shared; each scene construction remains an independent effect with no cross-mount cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The wrapper owns no renderer or cache; returned geometry, materials, lights and reflector targets transfer to the mounting host, while partial native construction before a throw is not reachable for wrapper cleanup.
 */
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
