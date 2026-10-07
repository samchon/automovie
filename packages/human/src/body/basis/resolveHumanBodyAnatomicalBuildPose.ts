import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  validatePose,
} from "@automovie/engine";

import { projectHumanBodySourceFrame } from "../anatomy/articulation/rig/projectHumanBodySourceFrame";
import { resolveHumanBodySourceRig } from "../anatomy/articulation/rig/resolveHumanBodySourceRig";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";
import type { IHumanBodyBuildPose } from "./IHumanBodyBuildPose";
import type { IHumanBodyBuildPoseInput } from "./IHumanBodyBuildPoseInput";
import { readHumanBodyResolvedClinicalPose } from "./readHumanBodyResolvedClinicalPose";
import { resolveHumanBodyPelvifemoralRhythm } from "./resolveHumanBodyPelvifemoralRhythm";

/**
 * Project one registered anatomical pose into the existing body skin rig.
 *
 * The source graph alone performs forward kinematics. The prepared public
 * rest rig supplies its clinical conversion and admission conventions, never
 * a second performed rig. Source public rest projections must mechanically
 * agree with those same frames before skin or tissue can consume the result.
 * This numerical registration check establishes no biological skin fit or
 * independently measured joint centre. Actual final-frame coordinates pass
 * the existing inverse and pose admission, including independent source
 * articulation and the hips-only rhythm, without changing caller goals.
 *
 * @evidence contracts/common.md#principled-implementation One anatomical FK supplies public skin placements and tissue sites; the existing rest rig and inverse own clinical coordinate meaning.
 * @evidence contracts/common.md#clear-and-simple-design Source resolution, rest registration, actual coordinate readback and admission occur in that order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or incompatible public rest projections refuse; no second rig, per-part position correction or clinical registration is inferred.
 * @evidence contracts/common.md#meaningful-documentation States mechanical registration, performed/rest distinction, actual frame admission and biological limits.
 * @evidence contracts/modeling.md#parameter-channels Source named goals and existing public pose/TT goals retain their separate authority; the source resolver refuses unavailable or conflicting coordinates.
 * @evidence contracts/modeling.md#spatial-conventions Rest and posed frames use right-handed +X-left/+Y-up/+Z-anterior body metres and unit quaternions. The existing inverse reports clinical degrees; the hips contribution remains its owner's signed degrees.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The numerical bridge projects existing rig identities and defines no geometry part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry No primitive population is selected.
 * @evidenceExclude contracts/modeling.md#shared-boundaries No surface or volume boundary is constructed; the body assembly consumes the shared placements.
 * @evidenceExclude contracts/modeling.md#rendered-observation The final body/person assembly owns observation, rather than this numerical bridge.
 * @evidence contracts/anatomy.md#anatomical-source Frames retain their compiled source and registration accounts; mechanical agreement with a public rig is not personal anatomical acquisition or clinical capacity.
 * @evidence contracts/anatomy.md#permitted-range The source resolver admits source-coordinate ranges and dependencies, then actual projected clinical coordinates pass the existing skeleton's pose admission; failures preserve the authored document.
 * @evidence contracts/anatomy.md#parametric-authority Only named source motion goals and existing public clinical goals enter the resolution; no public matrix or vertex adjustment is introduced.
 */
export function resolveHumanBodyAnatomicalBuildPose(
  input: IHumanBodyBuildPoseInput,
  rig: IAutoMovieHumanBodySkeletonRig,
): IHumanBodyBuildPose {
  const assembly = input.basis.anatomicalAssembly;
  if (assembly === undefined)
    throw new Error("Anatomical pose needs a registered source assembly.");
  const contribution =
    input.phase === "pre-pelvis"
      ? 0
      : (resolveHumanBodyPelvifemoralRhythm(
          input.basis,
          input.poseRows,
        ).contributions.find((one) => one.bone === "hips")?.degrees ?? 0);
  const anatomicalRig = resolveHumanBodySourceRig({
    rig: assembly.rig,
    pose: input.poseRows,
    authoredPose: input.document.pose ?? [],
    shoulders: input.document.shoulders ?? [],
    goals: input.document.anatomicalMotion ?? [],
    toes: input.document.toes,
    pelvicRhythmContributionDegrees: contribution,
  });
  const transforms = new Map(anatomicalRig.projections);
  // These are arithmetic registration tolerances, not clinical accuracy bounds.
  const assertRest = (
    bone: string,
    projected: IAutoMovieHumanBodyBoneWorldRest | undefined,
    expected: IAutoMovieHumanBodyBoneWorldRest,
  ): void => {
    if (projected === undefined)
      throw new Error(
        "Anatomical source lacks a public skin rest projection: " + bone,
      );
    const positionError = Math.max(
      ...(["x", "y", "z"] as const).map((axis) =>
        Math.abs(projected.position[axis] - expected.position[axis]),
      ),
    );
    const sign =
      projected.rotation.x * expected.rotation.x +
        projected.rotation.y * expected.rotation.y +
        projected.rotation.z * expected.rotation.z +
        projected.rotation.w * expected.rotation.w <
      0
        ? -1
        : 1;
    const rotationError = Math.max(
      ...(["x", "y", "z", "w"] as const).map((axis) =>
        Math.abs(projected.rotation[axis] * sign - expected.rotation[axis]),
      ),
    );
    if (positionError > 1e-9 || rotationError > 1e-12)
      throw new Error(
        "Anatomical source public rest registration differs from its skin rig: " +
          bone,
      );
  };
  for (const [bone, expected] of rig.rest)
    assertRest(bone, transforms.get(bone)?.rest, expected);
  for (const node of assembly.rig.nodes) {
    if (node.joint.kind !== "public-pose" || node.joint.reference === undefined)
      continue;
    const reference = node.joint.reference;
    const expected = rig.rest.get(reference.bone);
    const origin =
      reference.site === undefined
        ? Vector3.create(0, 0, 0)
        : node.sites.find((site) => site.id === reference.site)?.position;
    if (origin === undefined || expected === undefined)
      throw new Error(
        "Anatomical clinical conversion reference has no registered site or skin rest: " +
          node.id,
      );
    assertRest(
      node.id + "/" + reference.bone,
      projectHumanBodySourceFrame(node.rest, origin, reference.rotation),
      expected,
    );
  }
  const rayRest = new Map<string, IAutoMovieHumanBodyBoneWorldRest>();
  for (const ray of input.basis.toeRays ?? []) {
    const parent =
      ray.parent === "leftToes" || ray.parent === "rightToes"
        ? rig.rest.get(ray.parent)
        : rayRest.get(ray.parent);
    const head = input.landmarks[ray.head];
    if (parent === undefined || head === undefined)
      throw new Error(
        "Anatomical toe skin rest registration lacks its parent or head: " +
          ray.bone,
      );
    // The existing ray convention retains its parent's rest rotation at its own head.
    const expected = { position: head, rotation: parent.rotation };
    assertRest(
      ray.bone,
      anatomicalRig.toeProjections.get(ray.bone)?.rest,
      expected,
    );
    rayRest.set(ray.bone, expected);
  }
  const resolved: IAutoMovieResolvedBone[] = rig.skeleton.bones.map((bone) => {
    const frame = transforms.get(bone.bone)!.posed;
    const parent =
      bone.parent === null ? undefined : transforms.get(bone.parent)!.posed;
    return {
      bone: bone.bone,
      localRotation: Quaternion.multiply(
        parent === undefined
          ? Quaternion.identity()
          : Quaternion.inverse(parent.rotation),
        frame.rotation,
      ),
      worldPosition: frame.position,
      worldRotation: frame.rotation,
    };
  });
  const clinical = readHumanBodyResolvedClinicalPose({
    rig,
    resolved,
    basis: input.basis,
    pose: input.poseRows,
    tilt: -contribution,
    actualFrames: true,
  });
  const violations = validatePose({
    pose: { skeleton: rig.skeleton.id, root: null, joints: clinical },
    skeleton: rig.skeleton,
  }).items;
  if (violations.length !== 0)
    throw new Error(
      "Anatomical source projected pose violates the body clinical conventions: " +
        JSON.stringify(violations),
    );
  return { skeleton: rig.skeleton, transforms, clinical, rig, anatomicalRig };
}
