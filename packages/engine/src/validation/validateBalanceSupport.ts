import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  IAutoMovieJointAxes,
  indexSkeletonTopology,
  resolvePose,
} from "../kinematics";
import { convexHull2D } from "../math/convexHull2D";
import { pointHullDistance } from "../math/pointHullDistance";
import { sampleMotion } from "../motion/sampleMotion";
import { windowSampleTimes } from "../motion/windowSampleTimes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMovieResolvedBone } from "./../kinematics/IAutoMovieResolvedBone";
import type { IAutoMovieSkeletonTopology } from "./../kinematics/IAutoMovieSkeletonTopology";
import { IAutoMovieBalanceSupportWindow } from "./IAutoMovieBalanceSupportWindow";
import { ViolationCollector } from "./ViolationCollector";
import { fkReachableBones } from "./fkReachableBones";

const DEFAULT_MARGIN: number = 0.02;

const DEFAULT_SAMPLE_RATE: number = 24;

/** Fixed relative weights for the proximal-joint mass approximation, normalized over resolved bones; minor bones use the 0.2 fallback. */
const SEGMENT_MASS_FRACTION: Partial<Record<AutoMovieHumanoidBone, number>> = {
  hips: 14.2,
  spine: 13.9,
  chest: 15.6,
  upperChest: 6.0,
  neck: 1.1,
  head: 7.0,
  leftUpperArm: 2.8,
  rightUpperArm: 2.8,
  leftLowerArm: 1.6,
  rightLowerArm: 1.6,
  leftHand: 0.6,
  rightHand: 0.6,
  leftUpperLeg: 10.0,
  rightUpperLeg: 10.0,
  leftLowerLeg: 4.65,
  rightLowerLeg: 4.65,
  leftFoot: 1.45,
  rightFoot: 1.45,
};

/** Mass fraction for a minor bone the table omits (clavicle, toe, eye, finger). */
const DEFAULT_SEGMENT_MASS_FRACTION: number = 0.2;

const CENTER_BONE_EXPECTED: string =
  "center bone must exist in the target skeleton";

const CENTER_BONE_REACHABLE: string =
  "center bone is declared but not reachable from a root bone via forward kinematics";

const MARGIN_EXPECTED: string = "margin must be a finite number >= 0";

const SUPPORT_BONES_EXPECTED: string =
  "supportBones must contain at least one contact bone";

const SUPPORT_BONE_EXPECTED: string =
  "support bone must exist in the target skeleton";

const SUPPORT_BONE_REACHABLE: string =
  "support bone is declared but not reachable from a root bone via forward kinematics";

/**
 * Sample FK within valid support windows, project a single-bone or weighted joint-position center onto XZ, and warn beyond the support hull plus margin.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Sample FK within valid support windows, project a single-bone or weighted joint-position center onto XZ, and warn beyond the support hull plus margin.
 * @evidence contracts/common.md#clear-and-simple-design Shared clock/FK/hull owners keep contact and balance samples consistent; malformed annotations are errors before sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mass table is a proximal-joint approximation, not measured whole-body anatomy; physicsIntent suppresses imbalance warnings but not malformed-window errors.
 * @evidence contracts/common.md#meaningful-documentation Default24Hz and20mm margin, optional center bone, reachable support requirement and advisory effects are explicit.
 * @evidence contracts/performance.md#efficient-algorithms For W windows and T samples, motion/FK and contact hull costs dominate; each sample rebuilds the resolved map and weighted center.
 * @evidence contracts/performance.md#reuse-equivalent-work Skeleton topology/reachability are computed once per invocation, then reused across windows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller inputs are borrowed; per-sample maps/hulls release, while returned diagnostics grow with sampled failures and acquire no host handle.
 */
export const validateBalanceSupport: (props: {
  motion: IAutoMovieMotion;
  skeleton: IAutoMovieSkeleton;
  supports: readonly IAutoMovieBalanceSupportWindow[];
  sampleRate?: number;
  path?: string;
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  physicsIntent?: string;
}) => IAutoMovieValidation = (props: {
  /** Motion clip to sample. */
  motion: IAutoMovieMotion;

  /** Skeleton used for forward kinematics. */
  skeleton: IAutoMovieSkeleton;

  /** Declared support windows to test. */
  supports: readonly IAutoMovieBalanceSupportWindow[];

  /** Samples per second used by the validator. Defaults to `24`. */
  sampleRate?: number;

  /** JSON path of the support annotation being checked. Defaults to `$input`. */
  path?: string;

  /** Optional clinical-axis remap for rigs authored in semantic axes. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional rest-frame remap for clinical authoring. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /**
   * Marker that opts the clip out of the balance expectation: a deliberately
   * off-balance pose (wire-fu, a mid-spin freeze, a tiptoe) sets this and the
   * matching warnings are suppressed.
   */
  physicsIntent?: string;
}): IAutoMovieValidation => {
  const collector: ViolationCollector = new ViolationCollector();
  const suppressed: boolean = props.physicsIntent !== undefined;
  const sampleRate: number =
    props.sampleRate === undefined ? DEFAULT_SAMPLE_RATE : props.sampleRate;
  const sampleRateValid: boolean = isPositiveFinite(sampleRate);
  const path: string = props.path ?? "$input";
  const skeletonBones: Set<AutoMovieHumanoidBone> = new Set(
    props.skeleton.bones.map(
      (bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone,
    ),
  );
  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.skeleton,
  );
  const reachableBones: Set<AutoMovieHumanoidBone> = fkReachableBones(
    props.skeleton,
    topology,
  );

  if (!sampleRateValid)
    collector.push(
      "range",
      `${path}.sampleRate`,
      `sampleRate must be a finite number > 0, but was ${sampleRate}`,
      sampleRate,
    );

  for (const [supportIndex, support] of props.supports.entries()) {
    const sp: string = `${path}.supports[${supportIndex}]`;
    const centerBone: AutoMovieHumanoidBone | undefined = support.centerBone;
    const margin: number = support.margin ?? DEFAULT_MARGIN;
    // A single-bone override is validated for membership/reachability; the
    // default whole-body COM reads every resolved bone and needs no such gate.
    const centerMissing: boolean =
      centerBone !== undefined && !skeletonBones.has(centerBone);
    // A declared-but-detached bone (its parent chain never reaches a root) is
    // never returned by FK, so reading its resolved position would crash rather
    // than report the malformed rig. Gate on FK-reachability, not just
    // declaration.
    const centerUnreachable: boolean =
      centerBone !== undefined &&
      skeletonBones.has(centerBone) &&
      !reachableBones.has(centerBone);
    const emptySupport: boolean = support.supportBones.length === 0;
    let missingSupport: boolean = false;
    let unreachableSupport: boolean = false;
    const temporalInvalid: boolean =
      !Number.isFinite(support.start) ||
      !Number.isFinite(support.end) ||
      support.end <= support.start;
    const marginInvalid: boolean = !Number.isFinite(margin) || margin < 0;

    if (centerMissing)
      collector.push(
        "type",
        `${sp}.centerBone`,
        CENTER_BONE_EXPECTED,
        centerBone,
      );
    if (centerUnreachable)
      collector.push(
        "type",
        `${sp}.centerBone`,
        CENTER_BONE_REACHABLE,
        centerBone,
      );
    if (emptySupport)
      collector.push(
        "type",
        `${sp}.supportBones`,
        SUPPORT_BONES_EXPECTED,
        support.supportBones,
      );
    for (const bone of support.supportBones) {
      if (!skeletonBones.has(bone)) {
        missingSupport = true;
        collector.push(
          "type",
          `${sp}.supportBones`,
          SUPPORT_BONE_EXPECTED,
          bone,
        );
      } else if (!reachableBones.has(bone)) {
        unreachableSupport = true;
        collector.push(
          "type",
          `${sp}.supportBones`,
          SUPPORT_BONE_REACHABLE,
          bone,
        );
      }
    }
    if (temporalInvalid)
      collector.push(
        "temporal",
        sp,
        `support window must have finite start/end with end > start, but was [${support.start}, ${support.end}]`,
        { start: support.start, end: support.end },
      );
    if (marginInvalid)
      collector.push("range", `${sp}.margin`, MARGIN_EXPECTED, margin);
    if (
      !sampleRateValid ||
      centerMissing ||
      centerUnreachable ||
      emptySupport ||
      missingSupport ||
      unreachableSupport ||
      temporalInvalid ||
      marginInvalid
    )
      continue;

    // The engine's shared sampling grid (endpoint-inclusive, end-clamped):
    // the same clock footskate/ground/self-intersection step, so the physics
    // validators can never drift onto different frame boundaries.
    const times: number[] = windowSampleTimes(
      support.start,
      support.end,
      sampleRate,
    );
    for (
      let sampleIndex: number = 0;
      sampleIndex < times.length;
      sampleIndex++
    ) {
      const time: number = times[sampleIndex]!;
      const resolved: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map<
        AutoMovieHumanoidBone,
        IAutoMovieVector3
      >();
      const pose: IAutoMovieResolvedBone[] = resolvePose(
        sampleMotion(props.motion, time).pose,
        props.skeleton,
        props.jointAxes,
        props.restFrames,
        topology,
      );
      for (const bone of pose) resolved.set(bone.bone, bone.worldPosition);
      const centerPosition: IAutoMovieVector3 =
        centerBone === undefined
          ? weightedCenterOfMass(resolved)
          : (resolved.get(centerBone) as IAutoMovieVector3);
      // A real convex hull of the support contacts, so a mis-ordered or
      // non-convex support list can no longer be misclassified. Handles the
      // 1-/2-/many-point cases uniformly (a lone contact or a collinear pair
      // collapses to a point/segment inside the hull query).
      const hull: IAutoMovieVector3[] = convexHull2D(
        support.supportBones.map(
          (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
            resolved.get(bone)!,
        ),
      );
      const distance: number = pointHullDistance(centerPosition, hull);
      if (distance > margin && !suppressed) {
        const roundedMargin: number = round(margin);
        const roundedTime: number = round(time);
        const overshoot: number = distance - margin;
        const expected: string = `center-of-mass projection must stay within support hull margin ${roundedMargin}m at t=${roundedTime}s (a pose may be deliberately off-balance; mark physicsIntent if it is intended)`;
        const violationPath: string = `${sp}.samples[${sampleIndex}].centerOfMass.supportDistance`;
        collector.warn("physics", violationPath, expected, distance, overshoot);
      }
    }
  }

  const validation: IAutoMovieValidation = collector.toValidation();
  return validation;
};

/**
 * Compute a weighted mean of resolved joint world positions using the fixed segment table and0.2 fallback.
 *
 * One pass accumulates mass and XYZ without an intermediate segment array.
 *
 * This proximal-joint approximation is not a measured anatomical mass distribution; positive resolved mass is a sampling premise.
 *
 * Output is a model/world-unit point and omitted table bones use the fixed fallback.
 *
 * R resolved bones cost O(R) arithmetic and constant accumulators.
 *
 * Table weights are shared, but positions/mass sums are recomputed for each sampled pose.
 *
 * Only a fresh point returns; resolved maps and source rig are not retained.
 */
const weightedCenterOfMass: (
  resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
) => IAutoMovieVector3 = (
  resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
): IAutoMovieVector3 => {
  let mass: number = 0;
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  for (const [bone, position] of resolved) {
    const weight: number =
      SEGMENT_MASS_FRACTION[bone] ?? DEFAULT_SEGMENT_MASS_FRACTION;
    mass += weight;
    x += weight * position.x;
    y += weight * position.y;
    z += weight * position.z;
  }
  return { x: x / mass, y: y / mass, z: z / mass };
};

/**
 * Require a finite scalar strictly greater than zero.
 *
 * The predicate gates sampling before invoking the shared clock.
 *
 * Zero/negative/nonfinite rates are refused, not defaulted after explicit input.
 *
 * Boolean success identifies a usable positive sample rate.
 *
 * One finite test and comparison take constant work.
 *
 * Window admission uses this same rate decision across all support windows.
 *
 * Only a boolean returns and no rate history is retained.
 */
const isPositiveFinite: (value: number) => boolean = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

/**
 * Round a diagnostic quantity to three decimals with Math.round(value*1000)/1000.
 *
 * The validateBalanceSupport owner applies presentation rounding after its actual predicate.
 *
 * Binary64 rounding is not an exact decimal serialization or decision tolerance.
 *
 * Only displayed metre/second quantities are rounded, leaving comparison arithmetic unchanged.
 *
 * Fixed scalar arithmetic takes constant work.
 *
 * Diagnostics reuse the same presentation rule within validateBalanceSupport, not cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
