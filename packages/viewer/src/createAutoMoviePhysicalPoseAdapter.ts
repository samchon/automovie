import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieSkinnedMesh } from "./AutoMovieSkinnedMesh.js";
import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";

/**
 * Apply solved world bone frames to an existing complete skin rig, retaining unlisted bones' authored local transforms.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Apply solved world bone frames to an existing complete skin rig, retaining unlisted bones' authored local transforms) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Apply solved world bone frames to an existing complete skin rig, retaining unlisted bones' authored local transforms) directly over its typed inputs (`model`) as nested iteration of depth 3 (map over [...bones]; for-of over Object.entries(poses); every over [ pose.position.x, p), delegating to `owned.has`, `ordered.push`, `owned.get`, `skins.push`, `skeletons.add`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (3 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 0.00001, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 106 lines and 11 top-level statements that reuses `owned.has`, `ordered.push`, `owned.get`, `skins.push`, `skeletons.add` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `model`; the dominant cost is nested iteration of depth 3 (map over [...bones]; for-of over Object.entries(poses); every over [ pose.position.x, p), performed once per call with 17 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 17 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function createAutoMoviePhysicalPoseAdapter(
  model: IAutoMovieModelObject,
): (poses: Readonly<Record<string, P.ITransform>>) => void {
  const bones: Map<string, THREE.Object3D> = new Map(model.bones);
  const owned: Map<THREE.Object3D, string> = new Map(
    [...bones].map(
      ([name, object]: [string, THREE.Object3D<THREE.Object3DEventMap>]): [
        THREE.Object3D,
        string,
      ] => [object, name],
    ),
  );
  const ordered: { name: string; object: THREE.Object3D }[] = [];
  const skins: THREE.SkinnedMesh[] = [];
  const skeletons: Set<THREE.Skeleton> = new Set();
  model.object.traverse((object: THREE.Object3D): void => {
    if (owned.has(object)) ordered.push({ name: owned.get(object)!, object });
    if (object instanceof THREE.SkinnedMesh) {
      skins.push(object);
      skeletons.add(object.skeleton);
    }
  });
  const inverse: THREE.Matrix4 = new THREE.Matrix4();
  const position: THREE.Vector3 = new THREE.Vector3();
  const rotation: THREE.Quaternion = new THREE.Quaternion();
  const scale: THREE.Vector3 = new THREE.Vector3();
  return (poses: Readonly<Record<string, P.ITransform>>): void => {
    for (const [bone, pose] of Object.entries(poses))
      if (
        !bones.has(bone) ||
        !pose ||
        ![
          pose.position.x,
          pose.position.y,
          pose.position.z,
          pose.rotation.x,
          pose.rotation.y,
          pose.rotation.z,
          pose.rotation.w,
        ].every(Number.isFinite) ||
        Math.abs(
          Math.hypot(
            pose.rotation.x,
            pose.rotation.y,
            pose.rotation.z,
            pose.rotation.w,
          ) - 1,
        ) > 1e-5
      )
        throw new Error(`Invalid physical display bone frame: ${bone}`);
    model.object.updateWorldMatrix(true, true);
    for (const { name, object } of ordered)
      if (Object.hasOwn(poses, name)) {
        for (
          let ancestor: THREE.Object3D | null = object;
          ancestor;
          ancestor = ancestor.parent
        )
          if (
            Math.max(
              Math.abs(ancestor.scale.x - 1),
              Math.abs(ancestor.scale.y - 1),
              Math.abs(ancestor.scale.z - 1),
            ) > 1e-5 ||
            ![ancestor.scale.x, ancestor.scale.y, ancestor.scale.z].every(
              Number.isFinite,
            )
          )
            throw new Error(
              "Physical bone display requires metre-scale rig ancestors",
            );
        object.getWorldScale(scale);
        if (
          Math.max(
            Math.abs(scale.x - 1),
            Math.abs(scale.y - 1),
            Math.abs(scale.z - 1),
          ) > 1e-5
        )
          throw new Error(
            "Physical bone display requires metre-scale rig ancestors",
          );
      }
    for (const { name, object } of ordered) {
      if (!Object.hasOwn(poses, name)) continue;
      const pose: P.ITransform = poses[name]!;
      const parent: THREE.Object3D | null = object.parent;
      position.set(pose.position.x, pose.position.y, pose.position.z);
      if (parent) {
        parent.updateWorldMatrix(true, false);
        position.applyMatrix4(inverse.copy(parent.matrixWorld).invert());
        parent.getWorldQuaternion(rotation).invert();
      } else rotation.identity();
      object.position.copy(position);
      object.quaternion
        .set(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w)
        .premultiply(rotation);
      object.updateMatrix();
      object.updateWorldMatrix(false, false);
    }
    model.object.updateWorldMatrix(true, true);
    for (const skeleton of skeletons) skeleton.update();
    for (const skin of skins) {
      if (skin instanceof AutoMovieSkinnedMesh) skin.invalidatePose();
      else AutoMovieSkinnedMesh.clearBounds(skin);
    }
  };
}
