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
 *
 * @evidence contracts/common.md#principled-implementation The admitted goal capability makes one prepared reference rig reusable after conversion; the same pose owner supplies the pre-pelvis reference and final performance.
 * @evidence contracts/common.md#clear-and-simple-design Preparation, shared baseline, existing conversion and an effective document form one boundary before weights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing declarations and duplicate source-pose authority refuse; no goal is accepted and ignored or substituted by a second moving rig.
 * @evidence contracts/common.md#meaningful-documentation Names the capability precondition, pre-pelvis stage and saved/effective distinction.
 * @evidence contracts/modeling.md#parameter-channels Existing thigh reference degrees become source pose rows before correctives and pelvic coordination; exact zero remains a requested goal.
 * @evidence contracts/modeling.md#spatial-conventions The converter reads metre body-space rest/current frames and existing source-degree axes/signs.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping No anatomical geometry part is defined.
 * @evidenceExclude contracts/modeling.md#emitted-geometry No primitive is emitted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The skin and source assembly own boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The final body/person consumers observe the converted performance.
 * @evidence contracts/anatomy.md#anatomical-source The exact basis supplies source-reference frames and qualification; these are not acquired personal hip motion measurements.
 * @evidence contracts/anatomy.md#permitted-range Capability, requested source envelope and converted/final pose admission retain their existing owners and preserve caller values on failure.
 * @evidence contracts/anatomy.md#parametric-authority Saved named reference goals lower through the existing quaternion owner, without editable frame vectors or vertices.
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
