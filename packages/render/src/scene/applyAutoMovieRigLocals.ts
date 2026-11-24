import type {
  AutoMovieHumanoidBone,
  IAutoMovieRigLocalTransform,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import { invalidateAutoMovieSkinnedPose } from "./invalidateAutoMovieSkinnedPose.js";

/**
 * Display complete evaluator-produced bone locals, including translations
 * caused by omitted intermediate joints. Values are absolute parent-relative
 * transforms, rather than deltas from the build's rest pose. `root` places the
 * model in its parent's frame. Every written scale becomes one.
 *
 * The map must contain exactly the target's mapped bone slots. Before any
 * mutation, rejects missing or extra slots, nonfinite components, malformed
 * tuples and quaternions whose squared norm differs from one by over 1e-6. An
 * empty map is valid for a nonrigged target. No quaternion is normalized.
 *
 * Refreshes local and world matrices, including changed ancestors, and
 * invalidates skinned bounds and CPU pose caches. The caller owns semantic
 * evaluation, morph weights, imported-runtime flushing and rendering.
 */
export function applyAutoMovieRigLocals(
  target: IAutoMovieModelObject,
  locals: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform>,
  root: IAutoMovieRigLocalTransform,
): void {
  validateLocal(root, "root");
  if (locals.size !== target.bones.size)
    throw new Error(
      "Rig locals must contain exactly the target's mapped bones",
    );
  for (const bone of target.bones.keys()) {
    const local: IAutoMovieRigLocalTransform | undefined = locals.get(bone);
    if (local === undefined)
      throw new Error(`Rig locals omit mapped bone "${bone}"`);
    validateLocal(local, bone);
  }

  // Parent-folded joint motion changes translations as well as rotations.
  // Explicit local updates also support a target with matrixAutoUpdate off.
  writeLocal(target.object, root);
  for (const [bone, local] of locals)
    writeLocal(target.bones.get(bone)!, local);

  // SkinnedMesh.updateMatrixWorld also refreshes bindMatrixInverse; the
  // similarly named Object3D.updateWorldMatrix does not invoke that override.
  target.object.parent?.updateWorldMatrix(true, false);
  target.object.updateMatrixWorld(true);
  invalidateAutoMovieSkinnedPose(target.object);
}

/**
 * Refuse a malformed local before the adapter begins mutating its target.
 *
 * Principled implementation: Checks exact tuple lengths, finite components and
 * squared quaternion norm with a 1e-6 admission tolerance, preserving rather
 * than normalizing admitted evaluator output. Clear and simple design: Shares
 * root and bone validation so one policy guards the complete update. Prohibited
 * implementation shortcuts: The same tolerance and checks apply to every slot,
 * without fixture exceptions. Meaningful documentation: States pre-mutation
 * refusal; the public adapter documents frames and tolerance. Efficient
 * algorithms: Constant work over seven scalar components. Reuse equivalent
 * work: A mutable supplied transform requires fresh validation on each call.
 * Bound retention and release resources: Retains no values and allocates only
 * an error when refusing.
 */
function validateLocal(local: IAutoMovieRigLocalTransform, name: string): void {
  const t: IAutoMovieRigLocalTransform["translation"] = local.translation;
  const q: IAutoMovieRigLocalTransform["rotation"] = local.rotation;
  if (
    t.length !== 3 ||
    q.length !== 4 ||
    Math.abs(q[0] ** 2 + q[1] ** 2 + q[2] ** 2 + q[3] ** 2 - 1) > 1e-6
  )
    throw new Error(
      `Invalid rig local "${name}": expected finite metric TR and a unit quaternion`,
    );
}

/**
 * Copy absolute TR and unit scale, then refresh even a manual local matrix.
 *
 * Principled implementation: Writes tuple components through Three
 * position/quaternion setters and updates its local matrix under the engine's
 * unit rig-scale convention. Clear and simple design: One write path serves
 * roots and bones after complete validation. Prohibited implementation
 * shortcuts: Copies admitted values unchanged; no per-consumer offsets or scale
 * compensations are applied. Meaningful documentation: States the absolute
 * write, scale and manual-matrix behavior. Efficient algorithms: Constant
 * scalar writes and one matrix composition. Reuse equivalent work: Mutates
 * existing Three vectors, quaternion and matrix without temporary allocation.
 * Bound retention and release resources: Retains no target or transform after
 * return.
 */
function writeLocal(
  target: THREE.Object3D,
  local: IAutoMovieRigLocalTransform,
): void {
  target.position.set(...local.translation);
  target.quaternion.set(...local.rotation);
  target.scale.set(1, 1, 1);
  target.updateMatrix();
}
