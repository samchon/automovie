import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  type IAutoMovieResolvedBone,
} from "@automovie/interface";

import { resolvePose } from "../kinematics/internal/resolvePose";
import { Matrix4 } from "../math/Matrix4";

/**
 * The column-major matrix that carries each part's local geometry into the
 * model's own frame, or `null` for a part already authored in it.
 *
 * A part's own transform is applied first; a part attached to a bone the
 * skeleton's rest pose resolves is then carried by that bone's world rest
 * placement (position and rotation, unit scale). A bone the rest pose does not
 * resolve leaves its part unattached. `null` marks a part with no transform and
 * no resolved bone, so a caller can keep its coordinates bit for bit instead of
 * multiplying by an identity. The rest pose is resolved at most once, and only
 * when some part is attached. Units are model metres.
 *
 * @param model Model whose parts are placed.
 * @returns One entry per part object of `model.parts`, in part order.
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
