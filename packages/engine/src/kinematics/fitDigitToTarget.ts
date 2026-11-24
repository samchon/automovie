import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieFitDigitDescent,
  IAutoMovieFitDigitToTarget,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieJointRotationFrame,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { getConstraint } from "../rom/getConstraint";
import { descendDigitTasks } from "./descendDigitTasks";
import { indexSkeletonTopology } from "./indexSkeletonTopology";
import { preparePoseResolution } from "./preparePoseResolution";
import type { prepareSkeletonPoseResolution } from "./prepareSkeletonPoseResolution";
import { resolvePose } from "./resolvePose";
import { swingTwistRange } from "./swingTwistRange";

/**
 * Put a point of a digit (its tip or its pad, a frame on its distal phalanx) on
 * a world point, with the digit's own joints alone, inside their range of
 * motion: the inverse kinematics of one finger or the thumb with the hand where
 * the pose has placed it.
 *
 * Every free axis of every joint of the digit (an axis its constraint does not
 * hold immobile) is a variable, in clinical degrees. The fit has two tasks in
 * priority order. The first puts the effector on the target: its residual is
 * the distance between them. The second, bettered only in what the first leaves
 * free, turns the effector's normal onto the target normal when one is given
 * (the misalignment scaled by the effector's distance from its joint, an arc
 * length, so a degree of tilt counts as the millimetres it swings the phalanx)
 * and keeps a finger's interphalangeal coupling, the distal joint following the
 * middle one at the ratio `coupling` (the coupling of hand animation, DIP = 2/3
 * PIP, Rijpkema and Girard 1991, SIGGRAPH 25(4):339-348, as relayed by the
 * hand-animation literature; provisional until read at the source), its
 * residual likewise that distance times the angle by which the distal joint
 * misses the ratio. The point goal, optionally eased by soft IK as described
 * below, is never traded against a normal or a coupling it does not allow.
 *
 * Each descent is `fitDigitDescent`: damped task-priority least squares
 * (Nakamura, Hanafusa and Yoshikawa 1987; Chiaverini 1997) with the active set
 * of a projected Newton method (Bertsekas 1982) for the joints on a bound, and
 * Levenberg-Marquardt damping (Madsen, Nielsen and Tingleff 2004). The
 * Jacobians are read by central differences on the engine's own forward
 * kinematics, so the angles mean what `resolvePose` displays, and every trial
 * is projected into the range (`clampJointToSkeleton`) before it is measured.
 * The point counts as reached within the effector's motion for one resolution
 * step of every joint, and a descent stops when its step moves no joint by more
 * than `ROM_TOLERANCE`, the resolution to which the engine resolves a joint's
 * angle. The fit is a continuation: it descends from the pose's own angles for
 * the digit, so a caller that seeds each fit from the one before follows a
 * moving target in one basin, its joints moving continuously. Only when that
 * fit cannot reach the target (the tip farther from it than one joint
 * resolution of every joint would move it) does it restart from the middle of
 * every range, where a digit folded the wrong way round its target is not
 * trapped, keeping the restart only if it comes nearer; it never takes the
 * better of two starts for a target the continued fit reaches, an argmin that
 * would switch basins between neighbouring targets. A caller's `rate` softens
 * the target near full extension, where the exact inverse has an unbounded
 * derivative: an exponential soft IK. Below the soft band the target is
 * unchanged; within it, some reach is traded for a bounded radial extension
 * rate. The band's width comes from the chain's lengths and the requested rate,
 * not the seed's posture. This controls the full-extension singularity, not
 * every possible change of basin of a constrained digit. The result is
 * deterministic for its input: fixed starts, a fixed order of variables and no
 * random draw. A target outside the digit's workspace is fitted as nearly as
 * this constrained local solve reaches it. With `rate` it fits the eased target
 * instead, so its constrained minimum may differ from the original target's. In
 * either case `residual` reports distance to the original target, including any
 * reach traded away, so a caller refuses or accepts by its own bound.
 *
 * @param input The rig, the posed body, the digit's joints and the effector and
 *   target.
 * @returns The digit's fitted joints, the effector's world point and the
 *   residual.
 * @throws {Error} When the digit names no joint, a bone cannot be resolved, or
 *   `rate` is not finite and positive.
 */
export function fitDigitToTarget(
  input: IAutoMovieFitDigitToTarget.IInput,
): IAutoMovieFitDigitToTarget.IResult {
  if (input.bones.length === 0)
    throw new Error("A digit fit needs the digit's joints");
  if (input.rate !== undefined && !(input.rate > 0))
    throw new Error("A digit fit's rate must be finite and positive");
  const topology: IAutoMovieSkeletonTopology =
    input.topology ?? indexSkeletonTopology(input.skeleton);
  const prepared: ReturnType<typeof preparePoseResolution> =
    input.prepared ?? preparePoseResolution();
  let fixedPose:
    | ReturnType<prepareSkeletonPoseResolution.IRig["preparePose"]>
    | undefined;
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    input.effector.bone,
  ]);

  // A rate's first source FK also owns the later probe baseline. Complete
  // candidate edits override every claimed bone by the same last-record law.
  const readBones: (
    pose: IAutoMoviePose,
    demand: ReadonlySet<AutoMovieHumanoidBone>,
  ) => IAutoMovieResolvedBone[] = (
    pose: IAutoMoviePose,
    demand: ReadonlySet<AutoMovieHumanoidBone>,
  ): IAutoMovieResolvedBone[] =>
    input.rig === undefined
      ? resolvePose(
          pose,
          input.skeleton,
          input.jointAxes,
          input.restFrames,
          topology,
          prepared,
        )
      : pose !== input.pose
        ? input.rig.resolve(pose, prepared, demand)
        : (fixedPose ??= input.rig.preparePose(
            pose,
            requested,
            prepared,
          )).resolve([], demand);
  const coupling: number | null = input.coupling ?? null;
  const target: IAutoMovieVector3 = softTarget(input, readBones);

  // The digit's bones in the rig, the first record of each name, found in
  // one pass over the rig instead of one scan a bone for the free axes and
  // another for the clamp.
  const records: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
  for (const record of input.skeleton.bones)
    if (!records.has(record.bone) && input.bones.includes(record.bone))
      records.set(record.bone, record);

  // The digit's free axes, in the order of its joints, and each joint's
  // clamp under the same record (`clampJointToSkeleton.of`'s own
  // preparation, given the record it would scan for).
  const variables: IVariable[] = [];
  const clamps: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose) => IAutoMovieJointPose
  > = new Map();
  for (const bone of input.bones) {
    const found: IAutoMovieBone | undefined = records.get(bone);
    const constraint: IAutoMovieJointConstraint | null = getConstraint(
      bone,
      found?.constraint ?? null,
    );
    for (const axis of AXES)
      if (constraint === null || constraint[axis] !== null)
        variables.push({ bone, axis, range: constraint?.[axis] ?? null });
    clamps.set(
      bone,
      clampJointToSkeleton.resolved(
        bone,
        found,
        (): IAutoMovieJointRotationFrame | undefined =>
          constraint === null ||
          constraint.swingTwist === undefined ||
          constraint.swingTwist === null
            ? undefined
            : swingTwistRange.of(bone, input.skeleton),
      ),
    );
  }

  // A full-source baseline needs no second non-digit prefix.
  const others: IAutoMovieJointPose[] =
    fixedPose === undefined
      ? input.pose.joints.filter(
          (j: IAutoMovieJointPose): boolean => !input.bones.includes(j.bone),
        )
      : [];

  // The digit's joints for a vector of variables, projected into the range.
  const joints: (x: readonly number[]) => IAutoMovieJointPose[] = (
    x: readonly number[],
  ): IAutoMovieJointPose[] =>
    input.bones.map((bone: AutoMovieHumanoidBone): IAutoMovieJointPose => {
      const joint: IAutoMovieJointPose = {
        bone,
        flexion: null,
        abduction: null,
        twist: null,
      };
      variables.forEach((v: IVariable, i: number): void => {
        if (v.bone === bone) joint[v.axis] = x[i]!;
      });
      return clamps.get(bone)!(joint);
    });
  const read: (list: readonly IAutoMovieJointPose[]) => number[] = (
    list: readonly IAutoMovieJointPose[],
  ): number[] =>
    variables.map((v: IVariable): number => {
      const joint: IAutoMovieJointPose | undefined = list.find(
        (j: IAutoMovieJointPose): boolean => j.bone === v.bone,
      );
      return joint?.[v.axis] ?? 0;
    });

  // The effector's world frame under the digit's joints.
  const place: (list: readonly IAutoMovieJointPose[]) => IFrame = (
    list: readonly IAutoMovieJointPose[],
  ): IFrame => {
    const resolved: IAutoMovieResolvedBone | undefined = (
      input.rig === undefined
        ? readBones({ ...input.pose, joints: [...others, ...list] }, requested)
        : (fixedPose ??= input.rig.preparePose(
            { ...input.pose, joints: others },
            requested,
            prepared,
          )).resolve(list)
    ).find(
      (r: IAutoMovieResolvedBone): boolean => r.bone === input.effector.bone,
    );
    if (resolved === undefined)
      throw new Error(`A digit fit cannot resolve ${input.effector.bone}`);
    return {
      point: Vector3.add(
        resolved.worldPosition,
        Quaternion.rotateVector(resolved.worldRotation, input.effector.point),
      ),
      normal: Quaternion.rotateVector(
        resolved.worldRotation,
        input.effector.normal,
      ),
    };
  };

  // Both tasks read one exact candidate before the next finite-difference
  // probe. Copy its scalars so even a reused input array cannot go stale.
  let previous: IReading | undefined;
  const reading: (x: readonly number[]) => IReading = (
    x: readonly number[],
  ): IReading => {
    if (
      previous !== undefined &&
      previous.values.length === x.length &&
      previous.values.every((value: number, index: number): boolean =>
        Object.is(value, x[index]),
      )
    )
      return previous;
    const list: IAutoMovieJointPose[] = joints(x);
    const frame: IFrame =
      previous !== undefined && sameJoints(previous.joints, list)
        ? previous.frame
        : place(list);
    previous = { values: [...x], joints: list, frame };
    return previous;
  };

  // The primary residual, metres: where the effector is less the target.
  // The secondary, metres: the normal's misalignment and the coupling, each
  // as an arc length on the distal phalanx.
  const length: number = Vector3.length(input.effector.point);
  const primary: (x: readonly number[]) => number[] = (
    x: readonly number[],
  ): number[] => {
    const at: IFrame = reading(x).frame;
    return [
      at.point.x - target.x,
      at.point.y - target.y,
      at.point.z - target.z,
    ];
  };
  let targetNormal: IAutoMovieVector3 | undefined;
  const secondary: (x: readonly number[]) => number[] = (
    x: readonly number[],
  ): number[] => {
    const candidate: IReading = reading(x);
    const list: IAutoMovieJointPose[] = candidate.joints;
    const r: number[] = [];
    if (input.normal !== undefined) {
      const miss: IAutoMovieVector3 = Vector3.cross(
        candidate.frame.normal,
        (targetNormal ??= Vector3.normalize(input.normal)),
      );
      r.push(miss.x * length, miss.y * length, miss.z * length);
    }
    if (coupling !== null && input.bones.length >= 3) {
      const middle: number = list[1]!.flexion ?? 0;
      const distal: number = list[2]!.flexion ?? 0;
      r.push(((distal - coupling * middle) * Math.PI * length) / 180);
    }
    return r;
  };

  // The effector's motion for one resolution step of every joint: the
  // nearest the point can be put, so the primary counts as met within it.
  const tolerance: IAutoMovieFitDigitDescent.IProps["tolerance"] = (
    _x: readonly number[],
    J1: readonly (readonly number[])[],
  ): number =>
    variables.reduce(
      (sum: number, _v: IVariable, i: number): number =>
        sum + Math.hypot(J1[0]![i]!, J1[1]![i]!, J1[2]![i]!) * ROM_TOLERANCE,
      0,
    );
  const seed: number[] = read(input.pose.joints);
  const descend: (start: readonly number[]) => descendDigitTasks.IResult = (
    start: readonly number[],
  ): descendDigitTasks.IResult =>
    descendDigitTasks({
      start,
      primary,
      secondary,
      project: (x: readonly number[]): number[] => read(joints(x)),
      step: ROM_TOLERANCE,
      tolerance,
    });

  // Continuation: the descent starts from the pose's own angles, so a
  // caller that seeds each fit from the one before follows the target
  // continuously in one basin. Only a continued fit that cannot reach (its
  // point farther than `tolerance`) restarts from the middle of every range,
  // where a digit folded the wrong way round its target is not trapped, and
  // keeps that fit only when it comes nearer.
  const continued: descendDigitTasks.IResult = descend(seed);
  const continuedReach: number = Math.hypot(...continued.primary);
  let x: number[] = continued.values;
  if (continuedReach > tolerance(continued.values, continued.primaryJacobian)) {
    const restarted: descendDigitTasks.IResult = descend(
      variables.map((v: IVariable): number =>
        v.range === null ? 0 : (v.range.min + v.range.max) / 2,
      ),
    );
    if (Math.hypot(...restarted.primary) < continuedReach) x = restarted.values;
  }

  const selected: IReading = reading(x);
  const fitted: IAutoMovieJointPose[] = selected.joints;
  const at: IFrame = selected.frame;
  return {
    joints: fitted,
    point: at.point,
    normal: at.normal,
    residual: Vector3.length(Vector3.subtract(at.point, input.target)),
  };
}

/**
 * /** Exponential soft IK in the radial coordinate: identity below L-s and L-s
 * exp(-(d-(L-s))/s) above it. For a hinge dividing the straight chain into
 * lengths a and b, the cosine rule gives L-d = k theta² + O(theta⁴), k =
 * ab/(2L) (pi/180)² in metres per degree squared. In that leading-order model
 * the inverse's radial rate at the band's start is 1/(2 sqrt(k s)) and falls
 * exponentially thereafter, giving s = 1/(4 k rate²), using the smallest hinge
 * curvature. This local model is not a global rate proof for the nonlinear,
 * range-constrained chain. The band is at most the chain's whole length; a
 * chain with no positive internal hinge has no full-extension fold to soften.
 * Link lengths are invariant under the pose; only the base's world place
 * follows it.
 */
const softTarget: (
  input: IAutoMovieFitDigitToTarget.IInput,
  read: (
    pose: IAutoMoviePose,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ) => IAutoMovieResolvedBone[],
) => IAutoMovieVector3 = (
  input: IAutoMovieFitDigitToTarget.IInput,
  read: (
    pose: IAutoMoviePose,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ) => IAutoMovieResolvedBone[],
): IAutoMovieVector3 => {
  if (input.rate === undefined) return input.target;
  const posed: IAutoMovieResolvedBone[] = read(
    input.pose,
    new Set(input.bones),
  );
  const points: IAutoMovieVector3[] = input.bones.map(
    (bone: AutoMovieHumanoidBone): IAutoMovieVector3 => {
      const frame: IAutoMovieResolvedBone | undefined = posed.find(
        (p: IAutoMovieResolvedBone): boolean => p.bone === bone,
      );
      if (frame === undefined)
        throw new Error(`A digit fit cannot resolve ${bone}`);
      return frame.worldPosition;
    },
  );
  const links: number[] = points
    .slice(1)
    .map((point: IAutoMovieVector3, i: number): number =>
      Vector3.length(Vector3.subtract(point, points[i]!)),
    );
  links.push(Vector3.length(input.effector.point));
  const reach: number = links.reduce(
    (sum: number, link: number): number => sum + link,
    0,
  );
  let left: number = 0;
  const curvatures: number[] = links
    .slice(0, -1)
    .map((link: number): number => {
      left += link;
      return ((left * (reach - left)) / (2 * reach)) * (Math.PI / 180) ** 2;
    })
    .filter((k: number): boolean => k > 0);
  if (curvatures.length === 0) return input.target;
  const width: number = Math.min(
    reach,
    1 / (4 * Math.min(...curvatures) * input.rate ** 2),
  );
  const delta: IAutoMovieVector3 = Vector3.subtract(input.target, points[0]!);
  const distance: number = Vector3.length(delta);
  if (distance === 0 || distance <= reach - width) return input.target;
  const eased: number =
    reach - width * Math.exp(-(distance - (reach - width)) / width);
  return Vector3.add(points[0]!, Vector3.scale(delta, eased / distance));
};

/** A variable of the fit: one free axis of one joint. */
interface IVariable {
  bone: AutoMovieHumanoidBone;
  axis: (typeof AXES)[number];

  /** The axis's range, clinical degrees; none when the joint has no constraint. */
  range: IAutoMovieAngleRange | null;
}

/** A private effector reading, world metres and a world normal. */
interface IFrame {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
}

/** Different trial vectors may project to the exact same admitted digit pose. */
function sameJoints(
  left: readonly IAutoMovieJointPose[],
  right: readonly IAutoMovieJointPose[],
): boolean {
  if (left.length !== right.length) return false;
  for (let index: number = 0; index < left.length; ++index) {
    const a: IAutoMovieJointPose = left[index]!;
    const b: IAutoMovieJointPose = right[index]!;
    if (
      a.bone !== b.bone ||
      !Object.is(a.flexion, b.flexion) ||
      !Object.is(a.abduction, b.abduction) ||
      !Object.is(a.twist, b.twist)
    )
      return false;
  }
  return true;
}

/** One exact candidate's private projected joints and effector reading. */
interface IReading {
  values: readonly number[];
  joints: IAutoMovieJointPose[];
  frame: IFrame;
}

/** The clinical axes of a joint, in the order variables are read. */
const AXES: readonly ["flexion", "abduction", "twist"] = [
  "flexion",
  "abduction",
  "twist",
];
