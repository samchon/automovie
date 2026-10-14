import {
  Quaternion,
  Vector3,
  resolvePose,
  validatePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IHumanBodyBuildPose } from "./IHumanBodyBuildPose";
import type { IHumanBodyBuildPoseInput } from "./IHumanBodyBuildPoseInput";
import { readHumanBodyResolvedClinicalPose } from "./readHumanBodyResolvedClinicalPose";
import { resolveHumanBodyAnatomicalBuildPose } from "./resolveHumanBodyAnatomicalBuildPose";
import { resolveHumanBodyNeutralAssemblyPose } from "./resolveHumanBodyNeutralAssemblyPose";
import { resolveHumanBodyPelvifemoralRhythm } from "./resolveHumanBodyPelvifemoralRhythm";
import { resolveHumanBodyShoulders } from "./resolveHumanBodyShoulders";
import { resolveHumanBodySkeleton } from "./resolveHumanBodySkeleton";

/**
 * Give skinning its rest-to-posed transforms only after every clinical reading of the requested pose is valid. The pelvis uses the one bilateral hip line after shoulder resolution and before transforms are published, so the thorax and each authored thigh keep their world orientation. This function allocates a new transform map for each document and leaves the basis and authored pose untouched. The caller has already checked the named TT shoulder goal against its basis range.
 *
 * Frames use the builder's right-handed Y-up, Z-forward metre coordinates. No mesh positions are changed here.
 *
 * @evidence contracts/common.md#principled-implementation Authored clinical coordinates are admitted before source/ordinary FK; TT shoulder resolution precedes a pelvis-only turn about the shared hip line, after which actual changed parent-relative coordinates pass admission before skin transforms escape.
 * @evidence contracts/common.md#clear-and-simple-design A prepared or newly shaped rig selects explicit neutral-source, articulated-source or ordinary-humanoid paths, each returning the same build-pose record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unregistered anatomical motion, invalid authored/final clinical coordinates and a missing finite hip line refuse without changing source goals; named shoulder admission remains the caller's required prior stage and no mesh/contact proof is inferred.
 * @evidence contracts/common.md#meaningful-documentation The comment gives shaped-rest ownership, shoulder-before-pelvis timing, retained thorax/thigh world orientation, same metre frame and fresh per-document transforms.
 * @evidence contracts/performance.md#efficient-algorithms Shared rig/FK and clinical owners determine rig-sized work; the ordinary pelvis branch adds hip lookup, one rigid turn and validation of changed root/children, then one linear transform-map pass.
 * @evidence contracts/performance.md#reuse-equivalent-work An explicitly prepared rig is reused for source-reference goals, and existing engine FK, TT and actual-clinical readers share the same conventions rather than recomputing an independent skeleton.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned transforms/rig belong to the build and no caller pose is mutated; current resolved records and changed-bone sets expire except returned state, with no persistent pose cache, handle or task.
 */
export function resolveHumanBodyBuildPose(
  input: IHumanBodyBuildPoseInput,
): IHumanBodyBuildPose {
  const { basis, document, poseRows, landmarks }: IHumanBodyBuildPoseInput =
    input;
  const rig: ReturnType<typeof resolveHumanBodySkeleton> =
    input.rig ?? resolveHumanBodySkeleton(basis, landmarks);
  const { skeleton, rest, frames, axes }: typeof rig = rig;
  // Admit authored coordinates before FK, then admit actual changed local
  // frames after the final pelvis transform. Combined coordinates are not
  // the scalar rhythm additions.
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: poseRows,
  };
  const rhythm: ReturnType<typeof resolveHumanBodyPelvifemoralRhythm> =
    resolveHumanBodyPelvifemoralRhythm(basis, poseRows);
  const violations: ReturnType<typeof validatePose>["items"] = validatePose({
    pose,
    skeleton,
  }).items;
  if (violations.length > 0)
    throw new Error(
      "Body pose violates the skeleton or its clinical ranges: " +
        JSON.stringify(violations),
    );
  if (basis.anatomicalAssembly?.mode === "neutral-only")
    return resolveHumanBodyNeutralAssemblyPose(input, rig);
  if (basis.anatomicalAssembly !== undefined)
    return resolveHumanBodyAnatomicalBuildPose(input, rig);
  if (document.anatomicalMotion !== undefined)
    throw new Error(
      "Anatomical motion needs a registered source assembly on this body basis.",
    );
  const transforms: Map<
    AutoMovieHumanoidBone,
    IAutoMovieHumanBodyBoneTransform
  > = new Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBoneTransform>();
  // The rhythm leaves the trunk and both thighs where the document put
  // them relative to the trunk and turns only the pelvis, posteriorly by
  // the tilt about the line through both hip centres, which leaves the hip
  // centres, the lifted thigh's authored direction and the other foot in
  // place while the pelvis-to-thigh and pelvis-to-lumbar angles change.
  const tilt: number =
    input.phase === "pre-pelvis"
      ? 0
      : -(
          rhythm.contributions.find(
            (
              one: ReturnType<
                typeof resolveHumanBodyPelvifemoralRhythm
              >["contributions"][number],
            ): boolean => one.bone === "hips",
          )?.degrees ?? 0
        );
  const resolvedBones: ReturnType<typeof resolveHumanBodyShoulders> =
    resolveHumanBodyShoulders(
      basis,
      document.shoulders ?? [],
      rest,
      resolvePose(pose, skeleton, axes, frames),
    );
  if (tilt !== 0) {
    const at: (
      bone: AutoMovieHumanoidBone,
    ) => ReturnType<typeof resolveHumanBodyShoulders>[number] = (
      bone: AutoMovieHumanoidBone,
    ): (typeof resolvedBones)[number] =>
      resolvedBones.find(
        (one: (typeof resolvedBones)[number]): boolean => one.bone === bone,
      )!;
    const left: ReturnType<typeof Vector3.create> =
      at("leftUpperLeg").worldPosition;
    const line: ReturnType<typeof Vector3.subtract> = Vector3.subtract(
      left,
      at("rightUpperLeg").worldPosition,
    );
    if (
      ![line.x, line.y, line.z].every(Number.isFinite) ||
      (line.x === 0 && line.y === 0 && line.z === 0)
    )
      throw new Error(
        "Body pelvifemoral tilt needs a finite nonzero line through both hip centres.",
      );
    const axis: ReturnType<typeof Vector3.normalize> = Vector3.normalize(line);
    // about +X (the subject's left) a positive angle carries the top of
    // the pelvis forward; a posterior tilt is the negative one
    const turn: ReturnType<typeof Quaternion.fromAxisAngle> =
      Quaternion.fromAxisAngle(axis, -tilt);
    const pelvis: ReturnType<typeof resolveHumanBodyShoulders>[number] =
      at("hips");
    pelvis.worldPosition = Vector3.add(
      left,
      Quaternion.rotateVector(
        turn,
        Vector3.subtract(pelvis.worldPosition, left),
      ),
    );
    pelvis.worldRotation = Quaternion.normalize(
      Quaternion.multiply(turn, pelvis.worldRotation),
    );
  }
  const clinical: ReturnType<typeof readHumanBodyResolvedClinicalPose> =
    readHumanBodyResolvedClinicalPose({
      rig,
      resolved: resolvedBones,
      basis,
      pose: poseRows,
      tilt,
    });
  if (tilt !== 0) {
    const root: AutoMovieHumanoidBone = skeleton.bones.find(
      (bone: (typeof skeleton.bones)[number]): boolean => bone.parent === null,
    )!.bone;
    const changed: Set<AutoMovieHumanoidBone> = new Set(
      skeleton.bones
        .filter(
          (bone: (typeof skeleton.bones)[number]): boolean =>
            bone.bone === root || bone.parent === root,
        )
        .map(
          (bone: (typeof skeleton.bones)[number]): AutoMovieHumanoidBone =>
            bone.bone,
        ),
    );
    const actualViolations: ReturnType<typeof validatePose>["items"] =
      validatePose({
        pose: {
          ...pose,
          joints: clinical.filter((joint: (typeof clinical)[number]): boolean =>
            changed.has(joint.bone),
          ),
        },
        skeleton,
      }).items;
    if (actualViolations.length > 0)
      throw new Error(
        "Body resolved pelvic-relative pose violates the skeleton or its clinical ranges: " +
          JSON.stringify(actualViolations),
      );
  }
  for (const resolved of resolvedBones)
    transforms.set(resolved.bone, {
      rest: rest.get(resolved.bone)!,
      posed: {
        position: resolved.worldPosition,
        rotation: resolved.worldRotation,
      },
    });
  return { skeleton, transforms, clinical, rig };
}
