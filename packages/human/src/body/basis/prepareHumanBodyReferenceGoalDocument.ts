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
 * A declared capability has already excluded goal-dependent rig anchors and reference feedback. The same body pose owner reads the prepared document before pelvic coordination, then the existing converter lowers reference orientations to source rows. Those rows become the sole corrective/rhythm input while its goal-independent shaped rig is retained for final FK. No separate rig performs the thighs, and omission keeps ordinary preparation.
 *
 * @evidence contracts/common.md#principled-implementation Exact source-reference capability and exclusive goal authorship are checked before the same shape/pose owner builds a pre-pelvis rig; relative rotations become source rows used by final corrective/rhythm preparation.
 * @evidence contracts/common.md#clear-and-simple-design No-goal requests return their document directly; requested goals prepare one baseline rig and delegate angle lowering to the existing source-reference converter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A thigh goal without its exact capability or concurrent authored source pose refuses; declared goal-independent anchors remain required rather than reconciling a separately generated rig.
 * @evidence contracts/common.md#meaningful-documentation The comment states pre-pelvis ordering, retained final-FK rig, exclusive source rows and omitted-goal behavior.
 * @evidence contracts/performance.md#efficient-algorithms Goal admission scans joint/pose records per goal, then shared weight/landmark/rig preparation and one linear resolved-bone pass supply the converter; no skin vertex evaluation occurs here.
 * @evidence contracts/performance.md#reuse-equivalent-work The ordinary body pose and weight owners are reused, and the goal-independent baseline rig is returned for final FK instead of preparing a second reference skeleton.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned prepared document/rig belong to the builder; temporary baseline state and resolved-bone arrays expire after conversion, with no cross-document cache, external handle or task.
 */
export function prepareHumanBodyReferenceGoalDocument(
  basis: IAutoMovieHumanBodyBasis,
  document: IAutoMovieHumanBodyBasisDocument,
): IHumanBodyReferenceGoalPreparation {
  if ((document.thighGoals ?? []).length === 0) return { document };
  for (const goal of document.thighGoals!) {
    if (
      basis.joints.find(
        (joint: IAutoMovieHumanBodyBasis["joints"][number]): boolean =>
          joint.bone === goal.bone,
      )?.sourceReferenceGoal === undefined
    )
      throw new Error(
        "Body source-reference goal needs its exact basis capability: " +
          goal.bone,
      );
    if (
      document.pose?.some(
        (
          row: NonNullable<IAutoMovieHumanBodyBasisDocument["pose"]>[number],
        ): boolean => row.bone === goal.bone,
      )
    )
      throw new Error(
        "Body thigh and source pose cannot author the same bone: " + goal.bone,
      );
  }
  const withoutGoals: IAutoMovieHumanBodyBasisDocument = {
    ...document,
    thighGoals: undefined,
  };
  const state: ReturnType<typeof humanBodyBasisWeights> = humanBodyBasisWeights(
    basis,
    withoutGoals,
    resolveHumanBodyShapeShoulderRest(basis, document.shape),
  );
  const baseline: ReturnType<typeof resolveHumanBodyBuildPose> =
    resolveHumanBodyBuildPose({
      basis,
      document: withoutGoals,
      poseRows: state.pose,
      landmarks: evaluateHumanBodyLandmarks(basis, state),
      phase: "pre-pelvis",
    });
  const resolved: IAutoMovieResolvedBone[] = baseline.skeleton.bones.map(
    (
      bone: (typeof baseline.skeleton.bones)[number],
    ): IAutoMovieResolvedBone => {
      const frame: NonNullable<
        ReturnType<typeof baseline.transforms.get>
      >["posed"] = baseline.transforms.get(bone.bone)!.posed;
      const parent: typeof frame | undefined =
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
