import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieResolvedBone,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieEngineKinematicsTypes } from "../AutoMovieEngineKinematicsTypes";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { AutoMovieEngineSkeletonRootParent } from "../AutoMovieEngineSkeletonRootParent";

/*
 * Propagate declared instantaneous local rotation rates through native FK.
 *
 * Every input bone must come from the same current resolvePose snapshot and
 * unchanged unit-rotation rig as topology, including the ancestors of every
 * demanded bone. Root placement must likewise have a unit rotation. Local
 * angular rates are radians per second in the moving bone's frame:
 * localRotation^-1 times its derivative has vector part omega/2. Root rates are
 * in the resolved bones' common frame, with linear velocity at position. A
 * missing local rate is unknown, including on an unlisted pose joint; a
 * producer that proves rest articulation constant supplies an explicit zero.
 *
 * Native FK applies no root/rest scale and holds each rest translation and rest
 * rotation fixed. This entry differentiates precisely that convention. Changing
 * rest transforms, changing axes/rest frames, or an independently
 * scaled/transformed bone snapshot needs a different derivative producer.
 * Missing ancestors/rates and non-finite inputs return undefined so the owner
 * can retain its generic sampled path. Inputs are read without modification;
 * the successful map and every velocity record are fresh and caller-owned.
 */
export function resolveBoneRates(
  topology: IAutoMovieSkeletonTopology,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  localBodyAngularRates: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
  root: AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsRootRate,
): Map<AutoMovieHumanoidBone, AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsBoneRate> | undefined {
  const resolved: Map<AutoMovieHumanoidBone, AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsBoneRate> =
    new Map();
  const walk: (
    definition: IAutoMovieBone,
    parentPosition: IAutoMovieVector3,
    parentRate: AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsBoneRate,
  ) => boolean = (
    definition: IAutoMovieBone,
    parentPosition: IAutoMovieVector3,
    parentRate: AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsBoneRate,
  ): boolean => {
    const bone: IAutoMovieResolvedBone | undefined = bones.get(definition.bone);
    if (bone === undefined) return true;

    const local: IAutoMovieVector3 | undefined = localBodyAngularRates.get(
      definition.bone,
    );
    if (local === undefined || bone.bone !== definition.bone) return false;

    // A fixed offset moves with the parent only. The child's own rotation
    // affects its attached mass points later, not its joint origin here.
    const offset: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      bone.worldPosition,
      parentPosition,
    );
    const linear: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      parentRate.linear,
      AutoMovieEngineVector3.cross(parentRate.angular, offset),
    );

    // Right-trivialized local rates live in the moving child frame, so the
    // complete child world rotation carries them into the common frame.
    const angular: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      parentRate.angular,
      AutoMovieEngineQuaternion.rotateVector(bone.worldRotation, local),
    );

    const rate: AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsBoneRate = { linear, angular };
    resolved.set(definition.bone, rate);
    for (const child of topology.childrenByParent.get(definition.bone) ?? [])
      if (!walk(child, bone.worldPosition, rate)) return false;
    return true;
  };

  for (const definition of topology.childrenByParent.get(
    AutoMovieEngineSkeletonRootParent,
  ) ?? [])
    if (!walk(definition, root.position, root)) return undefined;

  // A supplied descendant below a missing ancestor or a detached subtree was
  // never visited and cannot receive an inferred parent rate.
  return resolved.size === bones.size ? resolved : undefined;
}
