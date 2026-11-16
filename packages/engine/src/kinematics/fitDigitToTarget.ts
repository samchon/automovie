import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { getConstraint } from "../rom/getConstraint";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import type { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { fitDigitDescent } from "./fitDigitDescent";
import { indexSkeletonTopology } from "./indexSkeletonTopology";
import { resolvePose } from "./resolvePose";

/**
 * Put a point of a digit (its tip or its pad, a frame on its distal phalanx)
 * on a world point, with the digit's own joints alone, inside their range of
 * motion: the inverse kinematics of one finger or the thumb with the hand
 * where the pose has placed it.
 *
 * Every free axis of every joint of the digit (an axis its constraint does
 * not hold immobile) is a variable, in clinical degrees. The fit has two
 * tasks in priority order. The first puts the effector on the target: its
 * residual is the distance between them. The second, bettered only in what
 * the first leaves free, turns the effector's normal onto the target normal
 * when one is given (the misalignment scaled by the effector's distance from
 * its joint, an arc length, so a degree of tilt counts as the millimetres it
 * swings the phalanx) and keeps a finger's interphalangeal coupling, the
 * distal joint following the middle one at the ratio `coupling` (the
 * coupling of hand animation, DIP = 2/3 PIP, Rijpkema and Girard 1991,
 * SIGGRAPH 25(4):339-348, as relayed by the hand-animation literature;
 * provisional until read at the source), its residual likewise that distance
 * times the angle by which the distal joint misses the ratio. The point
 * goal, optionally eased by soft IK as described below, is never traded
 * against a normal or a coupling it does not allow.
 *
 * Each descent is `fitDigitDescent`: damped task-priority least squares
 * (Nakamura, Hanafusa and Yoshikawa 1987; Chiaverini 1997) with the active
 * set of a projected Newton method (Bertsekas 1982) for the joints on a
 * bound, and Levenberg-Marquardt damping (Madsen, Nielsen and Tingleff 2004).
 * The Jacobians are read by central differences on the engine's own forward
 * kinematics, so the angles mean what `resolvePose` displays, and every
 * trial is projected into the range (`clampJointToSkeleton`) before it is
 * measured. The point counts as reached within the effector's motion for one
 * resolution step of every joint, and a descent stops when its step moves no
 * joint by more than `ROM_TOLERANCE`, the resolution to which the engine
 * resolves a joint's angle.
 * The fit is a continuation: it descends from the pose's own angles for the
 * digit, so a caller that seeds each fit from the one before follows a
 * moving target in one basin, its joints moving continuously. Only when that
 * fit cannot reach the target (the tip farther from it than one joint
 * resolution of every joint would move it) does it restart from the middle
 * of every range, where a digit folded the wrong way round its target is not
 * trapped, keeping the restart only if it comes nearer; it never takes the
 * better of two starts for a target the continued fit reaches, an argmin
 * that would switch basins between neighbouring targets. A caller's `rate`
 * softens the target near full extension, where the exact inverse has an
 * unbounded derivative: the exponential soft IK of Andy Nicholas (2006),
 * demonstrated in Jeremie Passerin's "Control Rig: 5.3: Soft IK" (2024,
 * https://dev.epicgames.com/community/learning/tutorials/y4Ll/unreal-engine-control-rig-5-3-soft-ik).
 * Below the soft band the target is unchanged; within it, some reach is
 * traded for a bounded radial extension rate. The band's width comes from
 * the chain's lengths and the requested rate, not the seed's posture.
 * This controls the full-extension singularity, not every possible change
 * of basin of a constrained digit. The result is
 * deterministic for its input: fixed starts, a fixed order of variables and
 * no random draw. A target outside the digit's workspace is fitted as
 * nearly as this constrained local solve reaches it. With `rate` it fits
 * the eased target instead, so its constrained minimum may differ from
 * the original target's. In either case `residual` reports distance to the
 * original target, including any reach traded away, so a caller refuses
 * or accepts by its own bound.
 *
 * @param input The rig, the posed body, the digit's joints and the effector and target.
 * @returns The digit's fitted joints, the effector's world point and the residual.
 * @throws {Error} When the digit names no joint, a bone cannot be resolved, or `rate` is not finite and positive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the variables, the two tasks and their units and order, the coupling's source and status, the method and its sources, the reach and stop rules and their owner, the continuation, determinism and the out-of-reach behaviour.
 * @evidence contracts/development/implementation.md#principled-implementation Damped task-priority least squares (Nakamura et al. 1987, Chiaverini 1997) through `fitDigitDescent` on the engine's forward kinematics, every trial measured after the range clamp, stopping at the engine's joint-angle resolution; continuation from the caller's seed. Optional exponential soft IK eases only the target's radial distance in a band derived from the full-extension curvature.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two residual functions over the digit's variables, one continued descent and a restart only when it cannot reach.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No iteration count and no weight between the tasks: the fit ends at the joint-angle resolution and reports distance from the original target, including any reach soft IK trades away. The width is derived from the chain lengths and `rate`; it does not penalise departure from an arbitrary seed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each evaluation is one forward kinematics of the rig, linear in its bones; a Jacobian costs two per variable (at most 9 for a digit of three joints) and the active set's probe one clamp per variable; a step solves two small systems of the free variables; a restart, run only for a target the continued fit cannot reach, doubles the work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input; a caller keeps the result by its own plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the returned joints belong to the caller.
 */
export function fitDigitToTarget(
  input: fitDigitToTarget.IInput,
): fitDigitToTarget.IResult {
  if (input.bones.length === 0)
    throw new Error("A digit fit needs the digit's joints");
  if (
    input.rate !== undefined &&
    !(Number.isFinite(input.rate) && input.rate > 0)
  )
    throw new Error("A digit fit's rate must be finite and positive");
  const topology: IAutoMovieSkeletonTopology =
    input.topology ?? indexSkeletonTopology(input.skeleton);
  const coupling: number | null = input.coupling ?? null;
  const target: IAutoMovieVector3 = softTarget(input, topology);

  // The digit's free axes, in the order of its joints.
  const variables: IVariable[] = [];
  for (const bone of input.bones) {
    const constraint: IAutoMovieJointConstraint | null = getConstraint(
      bone,
      input.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
        ?.constraint ?? null,
    );
    for (const axis of AXES)
      if (constraint === null || constraint[axis] !== null)
        variables.push({ bone, axis, range: constraint?.[axis] ?? null });
  }
  const clamps: Map<
    AutoMovieHumanoidBone,
    (joint: IAutoMovieJointPose) => IAutoMovieJointPose
  > = new Map(
    input.bones.map(
      (
        bone: AutoMovieHumanoidBone,
      ): [
        AutoMovieHumanoidBone,
        (joint: IAutoMovieJointPose) => IAutoMovieJointPose,
      ] => [bone, clampJointToSkeleton.of(bone, input.skeleton)],
    ),
  );
  const others: IAutoMovieJointPose[] = input.pose.joints.filter(
    (j: IAutoMovieJointPose): boolean => !input.bones.includes(j.bone),
  );

  // The digit's joints for a vector of variables, projected into the range.
  const joints = (x: readonly number[]): IAutoMovieJointPose[] =>
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
  const read = (list: readonly IAutoMovieJointPose[]): number[] =>
    variables.map((v: IVariable): number => {
      const joint: IAutoMovieJointPose | undefined = list.find(
        (j: IAutoMovieJointPose): boolean => j.bone === v.bone,
      );
      return joint?.[v.axis] ?? 0;
    });

  // The effector's world frame under the digit's joints.
  const place = (
    list: readonly IAutoMovieJointPose[],
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
    const pose: IAutoMoviePose = {
      ...input.pose,
      joints: [...others, ...list],
    };
    const resolved: IAutoMovieResolvedBone | undefined = resolvePose(
      pose,
      input.skeleton,
      input.jointAxes,
      input.restFrames,
      topology,
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

  // The primary residual, metres: where the effector is less the target.
  // The secondary, metres: the normal's misalignment and the coupling, each
  // as an arc length on the distal phalanx.
  const length: number = Vector3.length(input.effector.point);
  const primary = (x: readonly number[]): number[] => {
    const at = place(joints(x));
    return [
      at.point.x - target.x,
      at.point.y - target.y,
      at.point.z - target.z,
    ];
  };
  const secondary = (x: readonly number[]): number[] => {
    const list: IAutoMovieJointPose[] = joints(x);
    const r: number[] = [];
    if (input.normal !== undefined) {
      const miss: IAutoMovieVector3 = Vector3.cross(
        place(list).normal,
        Vector3.normalize(input.normal),
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
  const tolerance = (
    _x: readonly number[],
    J1: readonly (readonly number[])[],
  ): number =>
    variables.reduce(
      (sum: number, _v: IVariable, i: number): number =>
        sum + Math.hypot(J1[0]![i]!, J1[1]![i]!, J1[2]![i]!) * ROM_TOLERANCE,
      0,
    );
  const jacobian = (x: readonly number[]): number[][] =>
    [0, 1, 2].map((k: number): number[] =>
      x.map((_v: number, i: number): number => {
        const up: number[] = [...x];
        const down: number[] = [...x];
        up[i] = up[i]! + ROM_TOLERANCE;
        down[i] = down[i]! - ROM_TOLERANCE;
        return (primary(up)[k]! - primary(down)[k]!) / (2 * ROM_TOLERANCE);
      }),
    );

  const seed: number[] = read(input.pose.joints);
  const descend = (start: readonly number[]): number[] =>
    fitDigitDescent({
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
  const reach = (x: readonly number[]): number => Math.hypot(...primary(x));
  const continued: number[] = descend(seed);
  let x: number[] = continued;
  if (reach(continued) > tolerance(continued, jacobian(continued))) {
    const restarted: number[] = descend(
      variables.map((v: IVariable): number =>
        v.range === null ? 0 : (v.range.min + v.range.max) / 2,
      ),
    );
    if (reach(restarted) < reach(continued)) x = restarted;
  }

  const fitted: IAutoMovieJointPose[] = joints(x);
  const at = place(fitted);
  return {
    joints: fitted,
    point: at.point,
    normal: at.normal,
    residual: Vector3.length(Vector3.subtract(at.point, input.target)),
  };
}

/**
 * Companion types of {@link fitDigitToTarget}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation A posed rig, the digit's joints proximal to distal, a bone-local effector frame and a world target point with an optional normal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the fit reads and what its caller needs back: the joints, where the effector ended and how far from the target.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's poses, bones and vectors; the effector is the region frame `resolveAutoMovieHumanoidSurfaces` already gives.
 */
export namespace fitDigitToTarget {
  /** What a digit fit reads. */
  export interface IInput {
    /** The rig. */
    skeleton: IAutoMovieSkeleton;

    /** The posed body: its root, arm and hand place the digit's base; its own entries for the digit's joints are the fit's start. */
    pose: IAutoMoviePose;

    /** The digit's joints, proximal to distal: a finger's three, or the thumb's metacarpal, proximal and distal. */
    bones: readonly AutoMovieHumanoidBone[];

    /** The point brought to the target, in its bone's rest frame relative to the bone's joint, metres, with the outward unit normal there: a region frame of the digit's tip or pad. */
    effector: {
      bone: AutoMovieHumanoidBone;
      point: IAutoMovieVector3;
      normal: IAutoMovieVector3;
    };

    /** The target, world metres. */
    target: IAutoMovieVector3;

    /** The world direction the effector's normal is turned onto, when the contact needs one (a pad laid on a key faces against the key's normal); none when absent. */
    normal?: IAutoMovieVector3;

    /** The ratio of the distal joint's flexion to the middle joint's that a finger keeps as its second task, after the point; no coupling when absent (the thumb). */
    coupling?: number;

    /** The joint axes the pose is read with, as `resolvePose` takes them; the skeleton's own when absent. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** The rest frames the pose's clinical angles are lifted by, as `resolvePose` takes them; none when absent. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /** The rig's topology, when the caller has it. */
    topology?: IAutoMovieSkeletonTopology;

    /** Desired radial extension rate near full reach, positive finite degrees per metre. Derives a soft-IK band from the chain's smallest full-extension hinge curvature; targets in that band are eased short of full reach, and `residual` still measures the original target. Other constrained-IK basin changes are not bounded by this value. No softening when absent. */
    rate?: number;
  }

  /** What a digit fit returns. */
  export interface IResult {
    /** The digit's joints, inside their range, clinical degrees. */
    joints: IAutoMovieJointPose[];

    /** Where the effector ended, world metres. */
    point: IAutoMovieVector3;

    /** The effector's outward unit normal there, world frame. */
    normal: IAutoMovieVector3;

    /** The distance from the effector to the target, metres; zero within rounding when the target is reached. */
    residual: number;
  }
}

/**
 * Exponential soft IK in the radial coordinate: identity below L-s and
 * L-s exp(-(d-(L-s))/s) above it. For a hinge dividing the straight chain
 * into lengths a and b, the cosine rule gives L-d = k theta² + O(theta⁴),
 * k = ab/(2L) (pi/180)² in metres per degree squared. In that leading-order
 * model the inverse's radial rate at the band's start is 1/(2 sqrt(k s))
 * and falls exponentially thereafter, giving s = 1/(4 k rate²), using the
 * smallest hinge curvature. This local model is not a global rate proof
 * for the nonlinear, range-constrained chain.
 * The band is at most the chain's whole length; a chain with no positive
 * internal hinge has no full-extension fold to soften. Link lengths are
 * invariant under the pose; only the base's world place follows it.
 */
const softTarget = (
  input: fitDigitToTarget.IInput,
  topology: IAutoMovieSkeletonTopology,
): IAutoMovieVector3 => {
  if (input.rate === undefined) return input.target;
  const posed: IAutoMovieResolvedBone[] = resolvePose(
    input.pose,
    input.skeleton,
    input.jointAxes,
    input.restFrames,
    topology,
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

/** The clinical axes of a joint, in the order variables are read. */
const AXES = ["flexion", "abduction", "twist"] as const;
