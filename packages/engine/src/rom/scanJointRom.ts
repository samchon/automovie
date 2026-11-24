import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieJointRotationFrame,
  IAutoMovieQuaternion,
  IAutoMovieScanJointRom,
  IAutoMovieSwingTwistRange,
} from "@automovie/interface";

import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { nearestAngleAlias } from "../math/nearestAngleAlias";
import { abductionRange } from "./abductionRange";
import { swingConeAngle } from "./swingConeAngle";

/** Clinical axes in the scanner's existing report and finite-check order. */
const AXES: readonly ["flexion", "abduction", "twist"] = [
  "flexion",
  "abduction",
  "twist",
] as const;

/**
 * Measure one joint against its range of motion and report each fault to the
 * caller, building no message: the single owner of what counts as a ROM fault
 * and how far past the limit it lies, read by the pose gate
 * ({@link validateJointRom}), which words each fault, and by the solvers'
 * candidate ranking (`jointRomOvershoot`), which only sums them.
 *
 * Faults are reported in axis order (flexion, abduction, twist), then the
 * combined swing. A `null` angle is rest and reports nothing on its own axis;
 * `0` reports nothing on an immobile (`null`) axis, whose rest it is, but is
 * measured against a range that excludes it. A non-finite angle is reported
 * with an `undefined` overshoot, since it has no distance to a limit. An angle
 * on an immobile axis overshoots by its whole magnitude, and one outside its
 * interval by its distance to the nearer bound. The swing is the coupling of
 * flexion and abduction, a `null` axis contributing its actual rotation, `0`,
 * and overshoots by what it exceeds `swingDeg`.
 *
 * A ball joint whose constraint declares `swingTwist` is measured by its
 * rotation instead (`swingTwistRange`), in the frame of its bone the caller's
 * rig resolves (`rig`), or the humanoid tables' (`swingTwistRange.of`): a
 * `swing` fault by the degrees its direction lies past the reach of its flexion
 * and abduction ranges, then a `twist` fault by the degrees its turn about its
 * own axis lies past `swingTwist.twist`. A non-finite angle is reported as
 * above and nothing else is measured. A bone with no axes in that frame keeps
 * the three-angle scan.
 *
 * @param joint Joint angles in the constraint's degree frame; `null` is rest.
 * @param constraint Finite ordered axis intervals and an optional swing cone.
 * @param report Called once per fault with the faulted part, the measured value
 *   in degrees and its overshoot in degrees, `undefined` for a non-finite
 *   value.
 * @param rig The bone's frame as the caller's rig resolves it
 *   (`swingTwistRange.of(bone, skeleton)`); the humanoid tables' when absent.
 */
export function scanJointRom(
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  report: (
    part: IAutoMovieScanJointRom.Part,
    actual: number,
    overshoot: number | undefined,
  ) => void,
  rig?: IAutoMovieJointRotationFrame,
): void {
  scan(joint, constraint, report, rig, false);
}

/**
 * One unchanged fault scan, reporting faults or folding their ordered
 * distances. The explicit mode keeps an invalid required public callback
 * failing at its original first fault rather than treating its absence as
 * numeric mode.
 */
function scan(
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  report: Parameters<typeof scanJointRom>[2] | undefined,
  rig: IAutoMovieJointRotationFrame | undefined,
  score: boolean,
  compose?: (joint: IAutoMovieJointPose) => IAutoMovieQuaternion,
  rotation?: IAutoMovieQuaternion,
): number {
  let total: number = 0;

  // A ball joint gated by swing and twist reads its rotation, not its three
  // angles: the swing past the reach of its flexion and abduction ranges,
  // then the twist past its interval, in the frame its clinical angles are
  // written in: the caller's rig's, or the humanoid tables'.
  const range: IAutoMovieJointRotationFrame | undefined =
    constraint.swingTwist === undefined || constraint.swingTwist === null
      ? undefined
      : (rig ?? swingTwistRange.of(joint.bone));
  if (
    range !== undefined &&
    constraint.swingTwist !== undefined &&
    constraint.swingTwist !== null
  ) {
    // The rotation the angles were read from, when the caller has it on
    // the range's own frame, is what composing them gives back.
    return gate(
      total,
      rotation ??
        (compose === undefined
          ? jointToQuaternion(joint, range.axes, range.frame)
          : compose(joint)),
      constraint.swingTwist,
      constraint,
      range,
      report,
      score,
    );
  }
  for (const axis of AXES) {
    const angle: number | null = joint[axis];
    // A hip's abduction ceiling rises with its flexion (`abductionRange`).
    const allowed: IAutoMovieAngleRange | null =
      axis === "abduction"
        ? abductionRange(constraint, joint.flexion)
        : constraint[axis];
    if (angle === null) continue;
    // 0 is only implicitly fine on an IMMOBILE axis (it is that axis's rest);
    // against a zero-excluding override like [10, 90] it must report, or
    // validate would call clean what clampJointRom moves to the min (#1057)
    if (angle === 0 && allowed === null) continue;
    // immobile axis: the gap is the whole distance from the required 0
    if (allowed === null)
      total = fault(total, report, score, axis, angle, Math.abs(angle));
    else if (angle < allowed.min)
      total = fault(total, report, score, axis, angle, allowed.min - angle);
    else if (angle > allowed.max)
      total = fault(total, report, score, axis, angle, angle - allowed.max);
  }

  // Combined swing cone (ball joints): caps the corner the per-axis boxes miss.
  // The cone is a COUPLING between the two axes, not a per-axis check, so a
  // resting (`null`) axis is not exempt. It contributes its actual rotation, 0,
  // exactly as the renderer reads it (`jointToQuaternion`'s `?? 0`). Gating on
  // both axes being non-null made `{flexion:150, abduction:null}` pass while its
  // identical twin `{flexion:150, abduction:0}` (the same quaternion) failed
  // (#1245).
  if (typeof constraint.swingDeg === "number") {
    const swing: number = swingConeAngle(
      joint.flexion ?? 0,
      joint.abduction ?? 0,
    );
    if (swing > constraint.swingDeg)
      total = fault(
        total,
        report,
        score,
        "swing",
        swing,
        swing - constraint.swingDeg,
      );
  }
  return total;
}

/**
 * A swing-twist gate's faults of one rotation on the range's own frame: the
 * swing past its reach, then the twist past its interval.
 */
function gate(
  total: number,
  rotation: IAutoMovieQuaternion,
  swingTwist: NonNullable<IAutoMovieJointConstraint["swingTwist"]>,
  constraint: IAutoMovieJointConstraint,
  range: IAutoMovieJointRotationFrame,
  report: Parameters<typeof scanJointRom>[2] | undefined,
  score: boolean,
): number {
  const reading: IAutoMovieSwingTwistRange.IReading = swingTwistRange.read(
    rotation,
    range,
  );
  const reach: number = swingTwistRange.radius(
    constraint,
    range,
    reading.azimuth,
  );
  if (reading.swing > reach)
    total = fault(
      total,
      report,
      score,
      "swing",
      reading.swing,
      reading.swing - reach,
    );
  const twist: IAutoMovieAngleRange = swingTwist.twist;
  const turned: number = nearestAngleAlias(reading.twist, twist);
  if (turned < twist.min)
    total = fault(total, report, score, "twist", turned, twist.min - turned);
  else if (turned > twist.max)
    total = fault(total, report, score, "twist", turned, turned - twist.max);
  return total;
}

/**
 * Preserve actual callback effects, or add one score in the original report
 * order.
 */
function fault(
  total: number,
  report: Parameters<typeof scanJointRom>[2] | undefined,
  score: boolean,
  part: IAutoMovieScanJointRom.Part,
  actual: number,
  overshoot: number | undefined,
): number {
  if (!score) {
    report!(part, actual, overshoot);
    return total;
  }
  return total + (overshoot ?? Number.POSITIVE_INFINITY);
}

/** Companion declarations of {@link scanJointRom}. */
export namespace scanJointRom {
  /**
   * Sum the same faults in their report order, without a collector closure.
   * Missing distances are nonfinite faults and add Infinity, never zero. This
   * entry runs the same full scan with its existing rig admission and owns only
   * a local number; it retains no joint, constraint or result.
   *
   * @param joint The actual clinical angles, degrees.
   * @param constraint Their effective admitted ROM.
   * @param rig The caller's existing clinical frame, when supplied.
   * @returns The ordered overshoot sum in degrees, or Infinity for an
   *   unmeasurable fault.
   */
  export function overshoot(
    joint: IAutoMovieJointPose,
    constraint: IAutoMovieJointConstraint,
    rig?: IAutoMovieJointRotationFrame,
  ): number {
    return scan(joint, constraint, undefined, rig, true);
  }

  /**
   * Prepare numerical scans for one bone's unchanged constraint and clinical
   * frame. Every input joint must name that bone. The canonical humanoid frame
   * remains the fallback when no rig is supplied, as in a direct scan. Creating
   * the scorer admits no axis or angle; the first finite gated candidate admits
   * its basis at the original composition site. Later candidates share only
   * that basis and their pure axis factors, while all finite checks,
   * swing/twist readings and ordered additions still run.
   *
   * Preparation is constant work. One closure owns one optional prepared frame
   * and lazy joint composer for this synchronous operation, released with the
   * scorer. No joint, quaternion result or target history is cached.
   *
   * The same private fault scan evaluates every candidate, with finite checks
   * before any composition. Only the gated frame and composition factors are
   * prepared, without duplicating interval, cone or swing-twist fault rules.
   * Canonical fallback, ordered additions and tolerances remain unchanged.
   * Exact unchanged bone/constraint/axes/frame inputs justify that preparation;
   * each candidate still owns its fresh outer product and actual reading.
   *
   * A caller that read the joint's angles off a rotation, on a basis and rest
   * frame that are the range's own (`readsSwingTwistFrame`), passes that
   * rotation: a gated joint's range then reads it instead of the rotation its
   * angles compose back to, the same rotation up to the rounding of the round
   * trip, and composes nothing.
   */
  export function prepare(
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint,
    rig?: IAutoMovieJointRotationFrame,
  ): (joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number {
    const source: IAutoMovieJointRotationFrame | undefined =
      constraint.swingTwist === undefined || constraint.swingTwist === null
        ? undefined
        : (rig ?? swingTwistRange.of(bone));
    const range: IAutoMovieJointRotationFrame | undefined =
      source === undefined ? undefined : swingTwistRange.prepare(source);
    const compose:
      | ((joint: IAutoMovieJointPose) => IAutoMovieQuaternion)
      | undefined =
      range === undefined
        ? undefined
        : jointToQuaternionOnBasis.prepare(
            normalizeJointAxes(range.axes, "jointToQuaternion axes"),
            range.frame,
          );
    return (
      joint: IAutoMovieJointPose,
      rotation?: IAutoMovieQuaternion,
    ): number =>
      scan(joint, constraint, undefined, range, true, compose, rotation);
  }

  /**
   * The same overshoot sum for one bone gated by swing and twist, read from the
   * joint's rotation alone: what `prepare`'s scorer returns for a joint whose
   * angles were read off that rotation on the range's own basis and rest frame
   * (`readsSwingTwistFrame`), the gate's swing then twist faults in their
   * order, with no angles to read. Such angles, read off a finite rotation, are
   * finite, so the scorer's finite checks on them have nothing to report; a
   * rotation with a non-finite component is the caller's to refuse. Null for an
   * unconstrained or ungated bone, whose scan reads the angles themselves.
   *
   * @param bone The bone.
   * @param constraint Its effective ROM.
   * @param rig Its frame as the caller's rig resolves it; the humanoid tables'
   *   when absent.
   * @returns The scorer of a rotation, degrees, or null.
   */
  export function prepareRotated(
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
    rig?: IAutoMovieJointRotationFrame,
  ): ((rotation: IAutoMovieQuaternion) => number) | null {
    if (constraint === null) return null;
    const swingTwist: IAutoMovieJointConstraint["swingTwist"] =
      constraint.swingTwist;
    if (swingTwist === undefined || swingTwist === null) return null;
    const source: IAutoMovieJointRotationFrame | undefined =
      rig ?? swingTwistRange.of(bone);
    if (source === undefined) return null;
    const range: IAutoMovieJointRotationFrame = swingTwistRange.prepare(source);
    return (rotation: IAutoMovieQuaternion): number =>
      gate(0, rotation, swingTwist, constraint, range, undefined, true);
  }
}
