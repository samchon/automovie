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
 * The source graph alone performs forward kinematics. The prepared public rest rig supplies its clinical conversion and admission conventions, never a second performed rig. Source public rest projections must mechanically agree with those same frames before skin or tissue can consume the result. This numerical registration check establishes no biological skin fit or independently measured joint centre. Actual final-frame coordinates pass the existing inverse and pose admission, including independent source articulation and the hips-only rhythm, without changing caller goals.
 *
 * @evidence contracts/common.md#principled-implementation One registered anatomical source graph performs FK; projected public and toe rest frames must agree numerically with the prepared skin rig before actual-frame inverse coordinates pass the same clinical admission.
 * @evidence contracts/common.md#clear-and-simple-design Source posing, rest-projection checks, resolved public readout and clinical validation remain explicit stages returning one source/skin transform result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing projections/sites or arithmetic rest disagreement refuse instead of constructing a second performed rig; 1e-9 metre and 1e-12 quaternion registration policies establish no biological skin fit or measured joint centre.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies source-only FK, prepared clinical conventions, toe rest correspondence, numerical registration scope and unchanged authored goals.
 * @evidence contracts/performance.md#efficient-algorithms Source FK cost belongs to its graph owner; registration walks public projections and source nodes/rays, then public bone/clinical validation adds actual rig-sized work and source-site searches.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing source projections and the caller's prepared rest/clinical rig are reused; shared actual-frame inverse and pose validation avoid a separate anatomical coordinate convention.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned source rig and transform records belong to the build; ray-rest and resolved-readout temporaries expire, while the caller retains source input ownership and no handle or background task is acquired.
 */
export function resolveHumanBodyAnatomicalBuildPose(
  input: IHumanBodyBuildPoseInput,
  rig: IAutoMovieHumanBodySkeletonRig,
): IHumanBodyBuildPose {
  const assembly: IHumanBodyBuildPoseInput["basis"]["anatomicalAssembly"] = input.basis.anatomicalAssembly;
  if (assembly === undefined)
    throw new Error("Anatomical pose needs a registered source assembly.");
  const contribution: number =
    input.phase === "pre-pelvis"
      ? 0
      : (resolveHumanBodyPelvifemoralRhythm(
          input.basis,
          input.poseRows,
        ).contributions.find((one: ReturnType<typeof resolveHumanBodyPelvifemoralRhythm>["contributions"][number]): boolean => one.bone === "hips")?.degrees ?? 0);
  const anatomicalRig: ReturnType<typeof resolveHumanBodySourceRig> = resolveHumanBodySourceRig({
    rig: assembly.rig,
    pose: input.poseRows,
    authoredPose: input.document.pose ?? [],
    shoulders: input.document.shoulders ?? [],
    goals: input.document.anatomicalMotion ?? [],
    toes: input.document.toes,
    pelvicRhythmContributionDegrees: contribution,
  });
  const transforms: IHumanBodyBuildPose["transforms"] = new Map(anatomicalRig.projections);
  // These are arithmetic registration tolerances, not clinical accuracy bounds.
  const assertRest: (bone: string, projected: IAutoMovieHumanBodyBoneWorldRest | undefined, expected: IAutoMovieHumanBodyBoneWorldRest) => void = (
    bone: string,
    projected: IAutoMovieHumanBodyBoneWorldRest | undefined,
    expected: IAutoMovieHumanBodyBoneWorldRest,
  ): void => {
    if (projected === undefined)
      throw new Error(
        "Anatomical source lacks a public skin rest projection: " + bone,
      );
    const positionError: number = Math.max(
      ...(["x", "y", "z"] as const).map((axis: "x" | "y" | "z"): number =>
        Math.abs(projected.position[axis] - expected.position[axis]),
      ),
    );
    const sign: number =
      projected.rotation.x * expected.rotation.x +
        projected.rotation.y * expected.rotation.y +
        projected.rotation.z * expected.rotation.z +
        projected.rotation.w * expected.rotation.w <
      0
        ? -1
        : 1;
    const rotationError: number = Math.max(
      ...(["x", "y", "z", "w"] as const).map((axis: "x" | "y" | "z" | "w"): number =>
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
    const reference: typeof node.joint.reference = node.joint.reference;
    const expected: IAutoMovieHumanBodyBoneWorldRest | undefined = rig.rest.get(reference.bone);
    const origin: ReturnType<typeof Vector3.create> | undefined =
      reference.site === undefined
        ? Vector3.create(0, 0, 0)
        : node.sites.find((site: typeof node.sites[number]): boolean => site.id === reference.site)?.position;
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
  const rayRest: Map<string, IAutoMovieHumanBodyBoneWorldRest> = new Map<string, IAutoMovieHumanBodyBoneWorldRest>();
  for (const ray of input.basis.toeRays ?? []) {
    const parent: IAutoMovieHumanBodyBoneWorldRest | undefined =
      ray.parent === "leftToes" || ray.parent === "rightToes"
        ? rig.rest.get(ray.parent)
        : rayRest.get(ray.parent);
    const head: IAutoMovieHumanBodyBoneWorldRest["position"] | undefined = input.landmarks[ray.head];
    if (parent === undefined || head === undefined)
      throw new Error(
        "Anatomical toe skin rest registration lacks its parent or head: " +
          ray.bone,
      );
    // The existing ray convention retains its parent's rest rotation at its own head.
    const expected: IAutoMovieHumanBodyBoneWorldRest | undefined = { position: head, rotation: parent.rotation };
    assertRest(
      ray.bone,
      anatomicalRig.toeProjections.get(ray.bone)?.rest,
      expected,
    );
    rayRest.set(ray.bone, expected);
  }
  const resolved: IAutoMovieResolvedBone[] = rig.skeleton.bones.map((bone: typeof rig.skeleton.bones[number]): IAutoMovieResolvedBone => {
    const frame: IAutoMovieHumanBodyBoneWorldRest = transforms.get(bone.bone)!.posed;
    const parent: IAutoMovieHumanBodyBoneWorldRest | undefined =
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
  const clinical: ReturnType<typeof readHumanBodyResolvedClinicalPose> = readHumanBodyResolvedClinicalPose({
    rig,
    resolved,
    basis: input.basis,
    pose: input.poseRows,
    tilt: -contribution,
    actualFrames: true,
  });
  const violations: ReturnType<typeof validatePose>["items"] = validatePose({
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
