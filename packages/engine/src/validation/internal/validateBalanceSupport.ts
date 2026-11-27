import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  type IAutoMovieResolvedBone,
  type IAutoMovieSkeletonTopology,
  type IAutoMovieValidateBalanceSupport,
  IAutoMovieValidation,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/index";
import { indexSkeletonTopology } from "../../kinematics/internal/indexSkeletonTopology";
import { convexHull2D } from "../../math/internal/convexHull2D";
import { pointHullDistance } from "../../math/internal/pointHullDistance";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";
import { windowSampleTimes } from "../../motion/internal/windowSampleTimes";
import { AutoMovieEngineViolationCollector } from "../AutoMovieEngineViolationCollector";
import { fkReachableBones } from "./fkReachableBones";
import { admitMotionSampleRate } from "./admitMotionSampleRate";

const DEFAULT_MARGIN: number = 0.02;

const DEFAULT_SAMPLE_RATE: number = 24;

/**
 * Fixed relative weights for the proximal-joint mass approximation, normalized
 * over resolved bones; minor bones use the 0.2 fallback.
 */
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
 * Sample FK within valid support windows, project a single-bone or weighted
 * joint-position center onto XZ, and warn beyond the support hull plus a finite
 * nonnegative margin in metres. Invalid rates and margins give range findings.
 */
export function validateBalanceSupport(
  props: IAutoMovieValidateBalanceSupport.IProps,
): IAutoMovieValidation {
  const collector: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const suppressed: boolean = props.physicsIntent !== undefined;
  const sampleRate: number =
    props.sampleRate === undefined ? DEFAULT_SAMPLE_RATE : props.sampleRate;
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

  const sampleRateValid: boolean = admitMotionSampleRate(
    collector,
    path,
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
    const temporalInvalid: boolean = !(
      support.start > -Infinity &&
      support.end < Infinity &&
      support.end > support.start
    );
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
      const pose: IAutoMovieResolvedBone[] = AutoMovieEngineKinematics.resolvePose(
        AutoMovieEngineMotionSampling.samplePose(props.motion, time),
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
}

/**
 * Compute a weighted mean of resolved joint world positions using the fixed
 * segment table and0.2 fallback.
 *
 * One pass accumulates mass and XYZ without an intermediate segment array.
 *
 * This proximal-joint approximation is not a measured anatomical mass
 * distribution; positive resolved mass is a sampling premise.
 *
 * Output is a model/world-unit point and omitted table bones use the fixed
 * fallback.
 *
 * R resolved bones cost O(R) arithmetic and constant accumulators.
 *
 * Table weights are shared, but positions/mass sums are recomputed for each
 * sampled pose.
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
 * Round a diagnostic quantity to three decimals with
 * Math.round(value*1000)/1000.
 *
 * The validateBalanceSupport owner applies presentation rounding after its
 * actual predicate.
 *
 * Binary64 rounding is not an exact decimal serialization or decision
 * tolerance.
 *
 * Only displayed metre/second quantities are rounded, leaving comparison
 * arithmetic unchanged.
 *
 * Fixed scalar arithmetic takes constant work.
 *
 * Diagnostics reuse the same presentation rule within validateBalanceSupport,
 * not cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
