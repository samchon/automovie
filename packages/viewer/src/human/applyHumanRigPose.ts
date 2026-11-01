import type { AutoMovieHumanRig } from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieModelObject } from "../IAutoMovieModelObject.js";

/**
 * Move a built Human's bones to one evaluated pose, leaving its geometry alone.
 *
 * A pose lifts limbs out of the rest bounds Three culls a skinned mesh by, so a
 * posed skin stops culling and a rest pose restores it. Depth, shadow and
 * picking bounds are not settled here.
 *
 * @param target The built model.
 * @param pose Local transforms from `AutoMovieHumanRig.locals`.
 * @param rest Whether this is the rest pose.
 * @throws {Error} When a transform names a bone the model does not carry, before any bone moves.
 *
 * @evidence contracts/common.md#principled-implementation Writes the rig's parent-local translations and rotations onto the model's bones, which Three's skeleton then applies; the deformation stays in the existing skinning shaders.
 * @evidence contracts/common.md#clear-and-simple-design Pose evaluation stays in Human, geometry construction in buildModel and this function only places bones.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown bone refuses the whole pose before anything moves, and disabled culling is stated as a stopgap rather than a posed bound.
 * @evidence contracts/common.md#meaningful-documentation States the units' owner, the culling behaviour and what remains unsettled.
 * @evidence contracts/performance.md#efficient-algorithms One write per rig bone, one pass over the model's objects only when the rest state changes.
 * @evidence contracts/performance.md#reuse-equivalent-work Geometry, materials and bone objects are reused for every pose, so a pose never regenerates the body.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing and acquires no resource.
 */
export function applyHumanRigPose(
  target: IAutoMovieModelObject,
  pose: ReadonlyMap<AutoMovieHumanoidBone, AutoMovieHumanRig.ILocal>,
  rest: boolean,
): void {
  for (const bone of pose.keys())
    if (!target.bones.has(bone))
      throw new Error(`Human pose names a missing bone: ${bone}`);
  for (const [bone, local] of pose) {
    const node = target.bones.get(bone)!;
    node.position.set(...local.translation);
    node.quaternion.set(...local.rotation);
  }
  for (const part of target.parts.values()) part.frustumCulled = rest;
  target.object.updateMatrixWorld(true);
}
