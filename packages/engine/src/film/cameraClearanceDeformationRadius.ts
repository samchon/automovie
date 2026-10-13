import { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A pose-independent radius about a model's origin that contains everything
 * the model draws in any pose of its rig, in model-space metres.
 *
 * `extent` is the model's rest-pose box from {@link computeModelRestExtent}. A
 * rest point `p` bound at a joint whose root-to-joint chain length is `c` lies
 * at most `|p| + c` from that joint; after any joint rotations the joint stays
 * within `c` of the root, so the posed point stays within `|p| + 2c` of the
 * origin. Non-negative normalized skin weights blend such bounded positions
 * convexly, so the same radius holds skinned vertices as well as parts rigidly
 * attached to a bone. `c` is the longest chain that reaches a bone some part
 * rides or some skin influences; bone rest scale is ignored because neither
 * engine forward kinematics nor the viewer applies it. A model with no
 * skeleton answers the farthest rest corner alone.
 *
 * The caller must have validated the model with `validateModel`, which
 * guarantees closed parent links, finite rest translations and skin joint
 * names that exist. Throws an `Error` naming the rig or model when an
 * otherwise finite chain or radius overflows to infinity.
 *
 * @evidence contracts/common.md#principled-implementation Bounds posed geometry by the triangle inequality over a rigid joint chain, `|p| + 2c`, and relies on convexity of normalized non-negative skin weights for skinned vertices; the premises, a validated acyclic rig, finite rest translations and ignored bone scale, hold because the clearance compiler runs `validateModel` first and engine kinematics never reads rest scale; the bound is loose for short motions but never smaller than the true reach.
 * @evidence contracts/common.md#clear-and-simple-design One function the clearance compiler calls per obstacle model, with the farthest-corner and chain-reach steps as private helpers because nothing else reads them; it returns a scalar so the caller decides how to place and scale the sphere.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bone, rig or model is named; every bone some part or skin uses contributes its own chain length, and overflow throws instead of being clamped to a finite guess.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, the derivation of the bound, which bones contribute, why rest scale is ignored, the validation premise, and the overflow error.
 * @evidence contracts/performance.md#efficient-algorithms Linear in bones plus influenced joint references: each chain length is memoized so a bone's ancestry is summed once however many parts or skin joints reach it, and the eight rest corners cost a constant.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computed once per obstacle node per clearance compilation; nothing coordinates across calls, and the memo is local to one model's chain walk.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing after return; the bone index and chain memo are locals bounded by the model's bone count and dropped with the call.
 */
export const cameraClearanceDeformationRadius = (
  model: IAutoMovieModel,
  extent: { min: IAutoMovieVector3; max: IAutoMovieVector3 },
): number => {
  const radius: number = originRadius(extent) + 2 * maximumRigReach(model);
  if (!Number.isFinite(radius))
    throw new Error(
      `camera clearance deformation radius for model "${model.id}" overflows`,
    );
  return radius;
};

/** Farthest of the box's eight corners from the model origin. */
const originRadius = (extent: {
  min: IAutoMovieVector3;
  max: IAutoMovieVector3;
}): number => {
  let radius: number = 0;
  for (const x of [extent.min.x, extent.max.x])
    for (const y of [extent.min.y, extent.max.y])
      for (const z of [extent.min.z, extent.max.z])
        radius = Math.max(radius, Math.hypot(x, y, z));
  return radius;
};

/** Longest root-to-bone translation sum over the bones geometry rides. */
const maximumRigReach = (model: IAutoMovieModel): number => {
  const skeleton: IAutoMovieModel["skeleton"] = model.skeleton;
  if (skeleton === null) return 0;
  type Bone = (typeof skeleton.bones)[number];
  const bones: Map<Bone["bone"], Bone> = new Map(
    skeleton.bones.map((bone: Bone): [Bone["bone"], Bone] => [bone.bone, bone]),
  );
  const reaches: Map<Bone["bone"], number> = new Map();
  const resolve = (name: Bone["bone"]): number => {
    const cached: number | undefined = reaches.get(name);
    if (cached !== undefined) return cached;
    const bone: Bone = bones.get(name)!;
    const reach: number =
      Math.hypot(
        bone.rest.translation.x,
        bone.rest.translation.y,
        bone.rest.translation.z,
      ) + (bone.parent === null ? 0 : resolve(bone.parent));
    if (!Number.isFinite(reach))
      throw new Error(
        `camera clearance rig "${skeleton.id}" chain to bone "${name}" overflows`,
      );
    reaches.set(name, reach);
    return reach;
  };
  let reach: number = 0;
  for (const part of model.parts) {
    if (part.attachedBone !== null)
      reach = Math.max(reach, resolve(part.attachedBone));
    else if (part.geometry.type === "mesh" && part.geometry.mesh.skin !== null)
      for (const joint of part.geometry.mesh.skin.joints)
        reach = Math.max(reach, resolve(joint));
  }
  return reach;
};
