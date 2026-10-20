import { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "./kinematics/IAutoMovieResolvedBone";
import { resolvePose } from "./kinematics/resolvePose";
import { Matrix4 } from "./math/Matrix4";

/**
 * The column-major matrix that carries each part's local geometry into the
 * model's own frame, or `null` for a part already authored in it.
 *
 * A part's own transform is applied first; a part attached to a bone the
 * skeleton's rest pose resolves is then carried by that bone's world rest
 * placement (position and rotation, unit scale). A bone the rest pose does not
 * resolve leaves its part unattached. `null` marks a part with no transform
 * and no resolved bone, so a caller can keep its coordinates bit for bit
 * instead of multiplying by an identity. The rest pose is resolved at most
 * once, and only when some part is attached. Units are model metres.
 *
 * @param model Model whose parts are placed.
 * @returns One entry per part object of `model.parts`, in part order.
 *
 * @evidence contracts/common.md#principled-implementation Composes the part TRS with `Matrix4.compose` and pre-multiplies the attached bone's rest world placement, the order in which a rig carries a rigid attachment; the rest pose comes from `resolvePose` with no joint articulation, which is the skeleton's authored rest.
 * @evidence contracts/common.md#clear-and-simple-design The single owner of part-to-model placement for `autoMovieModelPartPoints` and `measureAutoMovieModelCrossings`, which then move points or meshes by it, so the two cannot disagree on where a part sits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No model, part or bone is special-cased; an unresolved bone leaves the part unattached by the stated rule, and `null` reports an unplaced part instead of inventing an identity that would round signed zeros.
 * @evidence contracts/common.md#meaningful-documentation States the matrix layout and composition order, the bone rule and its failure case, what `null` means and why it exists, when the pose is resolved, the units, and the result's keys and order.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the part count plus at most one rest-pose resolution and one bone search per attached part over the resolved bones.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recomputed per call from the given model; each caller derives it once per model it measures or describes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one sixteen-number matrix or `null` per part; the resolved pose is released on return.
 */
export const autoMovieModelPartMatrices = (
  model: IAutoMovieModel,
): Map<IAutoMovieModelPart, number[] | null> => {
  // Resolved on the first attached part, so a model without one never pays.
  let bones: IAutoMovieResolvedBone[] | null = null;
  const matrices: Map<IAutoMovieModelPart, number[] | null> = new Map();
  for (const part of model.parts) {
    let matrix: number[] | null =
      part.transform === null
        ? null
        : Matrix4.compose(
            part.transform.translation,
            part.transform.rotation,
            part.transform.scale,
          );
    if (part.attachedBone !== null && model.skeleton !== null)
      bones ??= resolvePose(
        { skeleton: model.skeleton.id, root: null, joints: [] },
        model.skeleton,
      );
    const bone: IAutoMovieResolvedBone | undefined =
      part.attachedBone === null || bones === null
        ? undefined
        : bones.find(
            (candidate: IAutoMovieResolvedBone): boolean =>
              candidate.bone === part.attachedBone,
          );
    if (bone !== undefined)
      matrix = Matrix4.multiply(
        Matrix4.compose(bone.worldPosition, bone.worldRotation, {
          x: 1,
          y: 1,
          z: 1,
        }),
        matrix ?? Matrix4.identity(),
      );
    matrices.set(part, matrix);
  }
  return matrices;
};
