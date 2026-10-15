import {
  IAutoMovieJointAxes,
  IAutoMovieRestFrame,
  resolveMorphTargetWeights,
  resolvePose,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieMeshMorphTarget,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import { applyTransform } from "./applyTransform.js";
import { morphTargetDriversOf } from "./morphTargetDriversOf.js";

/**
 * Apply a {@link IAutoMoviePose} to a built model by running the engine's
 * forward kinematics and writing each bone's local rotation onto the
 * corresponding `THREE.Bone`. The pose's root transform (if any) is applied to
 * the model root.
 *
 * The engine owns the math (semantic angles → quaternions), so the viewer only
 * copies results onto `three.js` objects, keeping rendering a thin, swappable
 * layer over the deterministic core.
 *
 * `restFrames` optionally reads each joint angle as **clinical** and maps it
 * into the rig's rest-relative space before articulating (e.g. abduction 180
 * raises either arm overhead regardless of side); omit it to treat the pose's
 * angles as raw rig-space, the historical behaviour.
 *
 * Morph targets that `buildModel` recorded as pose-driven take the weights
 * `resolveMorphTargetWeights` computes from the same pose, so a corrective
 * follows every applied pose; expression-written targets are left alone.
 *
 * Returns the skeleton bones the FK resolved but the model's bone map does not
 * carry (#1051). A deliberately partial imported map (a VRM without toes)
 * reports its unmapped bones every call: the host compares against what it
 * MEANT to map, so a typo in the bone map is distinguishable from an
 * intentional gap instead of both silently not articulating.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Delegates admitted semantic/clinical joint angles and skeleton/rest-axis conventions to engine forward kinematics, writes resolved local quaternions by humanoid bone id, writes engine-resolved driven morph weights by exact target name, then applies root translation/rotation with unit scale; unmapped bones are reported and null root resets to identity rather than retaining the last pose.
 * @evidence contracts/common.md#clear-and-simple-design Keeps pose and driver mathematics in resolvePose and resolveMorphTargetWeights and only copies their outputs into borrowed model bones, morph influences and root; caller-supplied partial bone mapping remains explicit instead of inventing missing joints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unit root scale is the engine rig convention, not a visual compensation; all mapped bones follow one FK result and missing bones are returned without fixture-specific tolerances or replaced solvers.
 * @evidence contracts/common.md#meaningful-documentation Gives local bone write, driven morph weights, optional clinical rest frames, unmapped-bone report, root reset and intentionally ignored root scale.
 * @evidence contracts/performance.md#efficient-algorithms Visits the engine's resolved bone list once with map lookups and fixed quaternion writes, then traverses the model's O objects once and resolves each driven mesh's targets; dominant work is engine FK over the skeleton, with temporary resolved/skipped records proportional to bones rather than vertex count.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the model's existing Bone objects and one engine FK implementation; different pose/skeleton/axes/rest frames require fresh resolution and target state is rewritten rather than cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows model/skeleton/pose and retains no solver or bone collection after return; skipped ids transfer to the caller and no GPU allocation or task is acquired.
 */
export const applyPose: (
  target: IAutoMovieModelObject,
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
) => AutoMovieHumanoidBone[] = (
  target: IAutoMovieModelObject,
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
): AutoMovieHumanoidBone[] => {
  const skipped: AutoMovieHumanoidBone[] = [];
  for (const r of resolvePose(pose, skeleton, jointAxes, restFrames)) {
    const bone: THREE.Object3D | undefined = target.bones.get(r.bone);
    if (bone === undefined) {
      skipped.push(r.bone);
      continue;
    }
    bone.quaternion.set(
      r.localRotation.x,
      r.localRotation.y,
      r.localRotation.z,
      r.localRotation.w,
    );
  }
  // Pose-driven morph targets follow the same pose, written beside the bones.
  target.object.traverse((object: THREE.Object3D): void => {
    const drivers:
      | readonly Pick<IAutoMovieMeshMorphTarget, "name" | "driver">[]
      | null = morphTargetDriversOf(object);
    const mesh: THREE.Mesh = object as THREE.Mesh;
    if (
      drivers === null ||
      mesh.morphTargetDictionary === undefined ||
      mesh.morphTargetInfluences === undefined
    )
      return;
    for (const [name, weight] of resolveMorphTargetWeights(drivers, pose)) {
      const index: number | undefined = mesh.morphTargetDictionary[name];
      if (index !== undefined) mesh.morphTargetInfluences[index] = weight;
    }
  });
  // A null root means "at the node's staged base", the engine's convention
  // (`resolvePose`/`animatedBaseAt` default it to identity, #1046). Keeping
  // the previous pose's root here would strand the model at the LAST rooted
  // pose (e.g. a walk's destination) when a gesture clip with null roots
  // takes over. Root SCALE is dropped (#1052): the engine's FK ignores it,
  // so a rendered root scale would be invisible to every validator that
  // measured the pose. The rig convention is rotation + translation only.
  const root: IAutoMovieTransform = pose.root ?? IDENTITY_ROOT;
  applyTransform(target.object, { ...root, scale: UNIT_SCALE });
  return skipped;
};

const UNIT_SCALE: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 };
const IDENTITY_ROOT: {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
} = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: UNIT_SCALE,
};
