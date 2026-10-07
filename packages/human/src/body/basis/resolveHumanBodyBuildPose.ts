/**
 * Resolve one shaped body's retargetable humanoid pose and its skin transforms.
 * The caller has already admitted shoulder goals before shape evaluation.
 * This owner builds the shaped rest skeleton, validates both document clinical
 * angles and actual pelvic-relative angles, resolves TT humeral goals after
 * the girdle, and turns the pelvis about the two hip centres. The transforms
 * share the builder's Y-up, Z-forward metre frame; no mesh is moved here.
 */
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
 * Give skinning its rest-to-posed transforms only after every clinical reading
 * of the requested pose is valid. The pelvis uses the one bilateral hip line
 * after shoulder resolution and before transforms are published, so the
 * thorax and each authored thigh keep their world orientation.
 * This function allocates a new transform map for each document and leaves
 * the basis and authored pose untouched. The caller has already checked the
 * named TT shoulder goal against its basis range.
 */
export function resolveHumanBodyBuildPose(
  input: IHumanBodyBuildPoseInput,
): IHumanBodyBuildPose {
  const { basis, document, poseRows, landmarks } = input;
  const rig = input.rig ?? resolveHumanBodySkeleton(basis, landmarks);
  const { skeleton, rest, frames, axes } = rig;
  // Admit authored coordinates before FK, then admit actual changed local
  // frames after the final pelvis transform. Combined coordinates are not
  // the scalar rhythm additions.
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: poseRows,
  };
  const rhythm = resolveHumanBodyPelvifemoralRhythm(basis, poseRows);
  const violations = validatePose({ pose, skeleton }).items;
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
  const transforms = new Map<
    AutoMovieHumanoidBone,
    IAutoMovieHumanBodyBoneTransform
  >();
  // The rhythm leaves the trunk and both thighs where the document put
  // them relative to the trunk and turns only the pelvis, posteriorly by
  // the tilt about the line through both hip centres, which leaves the hip
  // centres, the lifted thigh's authored direction and the other foot in
  // place while the pelvis-to-thigh and pelvis-to-lumbar angles change.
  const tilt =
    input.phase === "pre-pelvis"
      ? 0
      : -(
          rhythm.contributions.find((one) => one.bone === "hips")?.degrees ?? 0
        );
  const resolvedBones = resolveHumanBodyShoulders(
    basis,
    document.shoulders ?? [],
    rest,
    resolvePose(pose, skeleton, axes, frames),
  );
  if (tilt !== 0) {
    const at = (bone: AutoMovieHumanoidBone) =>
      resolvedBones.find((one) => one.bone === bone)!;
    const left = at("leftUpperLeg").worldPosition;
    const line = Vector3.subtract(left, at("rightUpperLeg").worldPosition);
    if (
      ![line.x, line.y, line.z].every(Number.isFinite) ||
      (line.x === 0 && line.y === 0 && line.z === 0)
    )
      throw new Error(
        "Body pelvifemoral tilt needs a finite nonzero line through both hip centres.",
      );
    const axis = Vector3.normalize(line);
    // about +X (the subject's left) a positive angle carries the top of
    // the pelvis forward; a posterior tilt is the negative one
    const turn = Quaternion.fromAxisAngle(axis, -tilt);
    const pelvis = at("hips");
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
  const clinical = readHumanBodyResolvedClinicalPose({
    rig,
    resolved: resolvedBones,
    basis,
    pose: poseRows,
    tilt,
  });
  if (tilt !== 0) {
    const root = skeleton.bones.find((bone) => bone.parent === null)!.bone;
    const changed = new Set(
      skeleton.bones
        .filter((bone) => bone.bone === root || bone.parent === root)
        .map((bone) => bone.bone),
    );
    const actualViolations = validatePose({
      pose: {
        ...pose,
        joints: clinical.filter((joint) => changed.has(joint.bone)),
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
