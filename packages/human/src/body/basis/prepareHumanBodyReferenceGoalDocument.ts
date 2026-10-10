import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IHumanBodyReferenceGoalPreparation } from "./IHumanBodyReferenceGoalPreparation";
import { evaluateHumanBodyLandmarks } from "./evaluateHumanBodyLandmarks";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { resolveHumanBodyBuildPose } from "./resolveHumanBodyBuildPose";
import { resolveHumanBodyShapeShoulderRest } from "./resolveHumanBodyShapeShoulderRest";
import { resolveHumanBodySourceReferenceGoals } from "./resolveHumanBodySourceReferenceGoals";

/**
 * Lower saved source-reference thigh goals before source deformation weights.
 *
 * A declared capability has already excluded goal-dependent rig anchors and
 * reference feedback. The same body pose owner reads the prepared document
 * before pelvic coordination, then the existing converter lowers reference
 * orientations to source rows. Those rows become the sole corrective/rhythm
 * input while its goal-independent shaped rig is retained for final FK. No
 * separate rig performs the thighs, and omission keeps ordinary preparation.
 */
export function prepareHumanBodyReferenceGoalDocument(
  basis: IAutoMovieHumanBodyBasis,
  document: IAutoMovieHumanBodyBasisDocument,
): IHumanBodyReferenceGoalPreparation {
  if ((document.thighGoals ?? []).length === 0) return { document };
  for (const goal of document.thighGoals!) {
    if (
      basis.joints.find((joint) => joint.bone === goal.bone)
        ?.sourceReferenceGoal === undefined
    )
      throw new Error(
        "Body source-reference goal needs its exact basis capability: " +
          goal.bone,
      );
    if (document.pose?.some((row) => row.bone === goal.bone))
      throw new Error(
        "Body thigh and source pose cannot author the same bone: " + goal.bone,
      );
  }
  const withoutGoals = { ...document, thighGoals: undefined };
  const state = humanBodyBasisWeights(
    basis,
    withoutGoals,
    resolveHumanBodyShapeShoulderRest(basis, document.shape),
  );
  const baseline = resolveHumanBodyBuildPose({
    basis,
    document: withoutGoals,
    poseRows: state.pose,
    landmarks: evaluateHumanBodyLandmarks(basis, state),
    phase: "pre-pelvis",
  });
  const resolved: IAutoMovieResolvedBone[] = baseline.skeleton.bones.map(
    (bone) => {
      const frame = baseline.transforms.get(bone.bone)!.posed;
      const parent =
        bone.parent === null
          ? undefined
          : baseline.transforms.get(bone.parent)!.posed;
      return {
        bone: bone.bone,
        worldPosition: frame.position,
        worldRotation: frame.rotation,
        localRotation: Quaternion.multiply(
          parent === undefined
            ? Quaternion.identity()
            : Quaternion.inverse(parent.rotation),
          frame.rotation,
        ),
      };
    },
  );
  return {
    document: resolveHumanBodySourceReferenceGoals({
      basis,
      document,
      rig: baseline.rig,
      baseline: resolved,
    }),
    rig: baseline.rig,
  };
}
