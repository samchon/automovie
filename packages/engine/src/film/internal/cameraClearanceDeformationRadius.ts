import {
  type IAutoMovieCameraClearanceDeformationRadius,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { overflowsBinary64 } from "../../math/internal/overflowsBinary64";

/**
 * A pose-independent radius about a model's origin that contains its supplied
 * portable part geometry in any pose of its rig, in model-space metres.
 * External bytes and renderer-only deformation are outside this bound.
 *
 * `extent` is the model's rest-pose box from {@link computeModelRestExtent}. A
 * rest point `p` bound at a joint whose root-to-joint chain length is `c` lies
 * at most `|p| + c` from that joint; after any joint rotations the joint stays
 * within `c` of the root, so the posed point stays within `|p| + 2c` of the
 * origin. Non-negative normalized skin weights blend such bounded positions
 * convexly, so the same radius holds skinned vertices as well as parts rigidly
 * attached to a bone. `c` is the longest chain that reaches a bone some part
 * rides or some skin influences; bone rest scale is ignored because neither
 * engine forward kinematics nor the viewer applies it. A model with no skeleton
 * answers the farthest rest corner alone.
 *
 * The caller must have validated the model with `validateModel`, which
 * guarantees closed parent links, finite rest translations and skin joint names
 * that exist. Throws an `Error` naming the rig or model when an otherwise
 * finite chain or radius overflows to infinity.
 */
export function cameraClearanceDeformationRadius(
  model: IAutoMovieModel,
  extent: IAutoMovieCameraClearanceDeformationRadius.IExtent,
): number {
  const doubled: number = 2 * maximumRigReach(model);
  const radius: number = originRadius(extent) + doubled;
  if (overflowsBinary64(doubled) || overflowsBinary64(radius))
    throw new Error(
      `camera clearance deformation radius for model "${model.id}" overflows`,
    );
  return radius;
}

/** Farthest of the box's eight corners from the model origin. */
function originRadius(extent: {
  min: IAutoMovieVector3;
  max: IAutoMovieVector3;
}): number {
  let radius: number = 0;
  for (const x of [extent.min.x, extent.max.x])
    for (const y of [extent.min.y, extent.max.y])
      for (const z of [extent.min.z, extent.max.z])
        radius = Math.max(radius, Math.hypot(x, y, z));
  return radius;
}

/** Longest root-to-bone translation sum over the bones geometry rides. */
function maximumRigReach(model: IAutoMovieModel): number {
  const skeleton: IAutoMovieModel["skeleton"] = model.skeleton;
  if (skeleton === null) return 0;
  const skeletonId: string = skeleton.id;
  type Bone = (typeof skeleton.bones)[number];
  const bones: Map<Bone["bone"], Bone> = new Map(
    skeleton.bones.map((bone: Bone): [Bone["bone"], Bone] => [bone.bone, bone]),
  );
  const reaches: Map<Bone["bone"], number> = new Map();
  function resolve(name: Bone["bone"]): number {
    const cached: number | undefined = reaches.get(name);
    if (cached !== undefined) return cached;
    const bone: Bone = bones.get(name)!;
    const step: number = Math.hypot(
      bone.rest.translation.x,
      bone.rest.translation.y,
      bone.rest.translation.z,
    );
    const reach: number =
      step + (bone.parent === null ? 0 : resolve(bone.parent));
    if (overflowsBinary64(step) || overflowsBinary64(reach))
      throw new Error(
        `camera clearance rig "${skeletonId}" chain to bone "${name}" overflows`,
      );
    reaches.set(name, reach);
    return reach;
  }
  let reach: number = 0;
  for (const part of model.parts) {
    if (part.attachedBone !== null)
      reach = Math.max(reach, resolve(part.attachedBone));
    else if (part.geometry.type === "mesh" && part.geometry.mesh.skin !== null)
      for (const joint of part.geometry.mesh.skin.joints)
        reach = Math.max(reach, resolve(joint));
  }
  return reach;
}
