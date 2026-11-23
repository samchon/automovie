import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmMirror } from "../posture/HumanArmMirror";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

type Part = IAutoMovieMotionHumanSupport.Part;
type Target = IAutoMovieMotionHumanBodyFitTypes.ITarget;
type Seed = IAutoMovieMotionHumanPosture | undefined;
type Frames = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
type TargetAt = (part: Part) => IAutoMovieVector3;
type Angles = NonNullable<IAutoMovieMotionHumanPosture["joints"]["hips"]>;

/**
 * When both hands and feet take homologous, fully placed sites, transfer the
 * better supported side's clinical angles to the other. The translation fits
 * all four material sites in least squares. The whole-body solver independently
 * scores the candidate on the original constraints.
 */
export function prepareBilateralSupport(
  body: IAutoMovieMotionHumanBody,
  from: IAutoMovieMotionHumanPosture,
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
  targets: readonly Target[],
): Seed {
  const required: readonly Part[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ];
  if (contacts.length !== required.length) return undefined;
  const partners: ReadonlySet<Part> = new Set(
    contacts.map(
      (contact: IAutoMovieMotionHumanSupport.IContact): Part => contact.part,
    ),
  );
  if (
    !required.every((part: Part): boolean => partners.has(part)) ||
    targets.some(
      (t: Target): boolean =>
        t.on !== undefined || (t.axes !== undefined && t.axes.length !== 3),
    )
  )
    return undefined;
  const forward: IAutoMovieVector3 = HumanFrame.forward(from.yaw);
  const across: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
  const targetAt: TargetAt = (part: Part): IAutoMovieVector3 =>
    targets[
      contacts.findIndex(
        (c: IAutoMovieMotionHumanSupport.IContact): boolean => c.part === part,
      )
    ]!.goal;
  const hand: IAutoMovieVector3 = Vector3.lerp(
    targetAt("leftHand"),
    targetAt("rightHand"),
    0.5,
  );
  const foot: IAutoMovieVector3 = Vector3.lerp(
    targetAt("leftFoot"),
    targetAt("rightFoot"),
    0.5,
  );
  // The longest component path has three midpoint operations, one
  // subtraction, one projection product and two dot-product additions.
  // Include the initial rounding of the supplied world coordinate.
  const tolerance: number =
    Number.EPSILON * (1 + Vector3.length(hand) + Vector3.length(foot)) * 8;
  if (Math.abs(Vector3.dot(Vector3.subtract(hand, foot), across)) > tolerance)
    return undefined;
  for (const suffix of ["Hand", "Foot"] as const) {
    const span: IAutoMovieVector3 = Vector3.subtract(
      targetAt(`left${suffix}`),
      targetAt(`right${suffix}`),
    );
    if (
      Math.abs(span.y) > tolerance ||
      Math.abs(Vector3.dot(span, forward)) > tolerance
    )
      return undefined;
  }
  const names: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    targets.map((t: Target): AutoMovieHumanoidBone => t.bone),
  );
  const prior: IAutoMoviePose = resolveHumanPosture(body, from);
  const frames: Frames = poseBones(body, prior, undefined, names);
  const errors: Record<AutoMovieHumanSide, number> = { left: 0, right: 0 };
  for (const [i, t] of targets.entries()) {
    const delta: IAutoMovieVector3 = error(frames, t);
    errors[contacts[i]!.part.startsWith("left") ? "left" : "right"] +=
      Vector3.dot(delta, delta);
  }
  const side: AutoMovieHumanSide =
    errors.left <= errors.right ? "left" : "right";
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const joint of prior.joints) {
    const angles: Angles = [
      joint.flexion ?? 0,
      joint.abduction ?? 0,
      joint.twist ?? 0,
    ];
    if (joint.bone.startsWith(side)) {
      joints[joint.bone] = angles;
      joints[HumanArmMirror.opposite(joint.bone)] = angles;
    } else if (
      !joint.bone.startsWith("left") &&
      !joint.bone.startsWith("right")
    )
      joints[joint.bone] = [angles[0], 0, 0];
  }
  const candidate: IAutoMovieMotionHumanPosture = {
    ...from,
    roll: 0,
    joints,
    limbs: {},
  };
  const paired: Frames = poseBones(
    body,
    resolveHumanPosture(body, candidate),
    undefined,
    names,
  );
  const shift: IAutoMovieVector3 = targets.reduce(
    (sum: IAutoMovieVector3, t: Target): IAutoMovieVector3 =>
      Vector3.add(sum, error(paired, t)),
    { x: 0, y: 0, z: 0 },
  );
  return {
    ...candidate,
    root: Vector3.addScaled(candidate.root, shift, 1 / targets.length),
  };
}

/** World displacement of the named material point to its actual goal. */
function error(bones: Frames, target: Target): IAutoMovieVector3 {
  const bone: IAutoMovieResolvedBone = bones.get(target.bone)!;
  const point: IAutoMovieVector3 =
    target.point === undefined
      ? bone.worldPosition
      : Vector3.add(
          bone.worldPosition,
          Quaternion.rotateVector(bone.worldRotation, target.point),
        );
  return Vector3.subtract(target.goal, point);
}
