import {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { SwingTwistFramePreparation } from "../kinematics/SwingTwistFramePreparation";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { nearestAngleAlias } from "../math/nearestAngleAlias";
import { swingConeAngle } from "./swingConeAngle";

/** Clinical axes in the scanner's existing report and finite-check order. */
const AXES: readonly ["flexion", "abduction", "twist"] = [
  "flexion",
  "abduction",
  "twist",
] as const;

/**
 * Measure one joint against its range of motion and report each fault to the
 * caller, building no message: the single owner of what counts as a ROM
 * fault and how far past the limit it lies, read by the pose gate
 * ({@link validateJointRom}), which words each fault, and by the solvers'
 * candidate ranking (`jointRomOvershoot`), which only sums them.
 *
 * Faults are reported in axis order (flexion, abduction, twist), then the
 * combined swing. A `null` angle is rest and reports nothing on its own axis;
 * `0` reports nothing on an immobile (`null`) axis, whose rest it is, but is
 * measured against a range that excludes it. A non-finite angle is reported
 * with an `undefined` overshoot, since it has no distance to a limit. An
 * angle on an immobile axis overshoots by its whole magnitude, and one
 * outside its interval by its distance to the nearer bound. The swing is the
 * coupling of flexion and abduction, a `null` axis contributing its actual
 * rotation, `0`, and overshoots by what it exceeds `swingDeg`.
 *
 * A ball joint whose constraint declares `swingTwist` is measured by its
 * rotation instead (`swingTwistRange`), in the frame of its bone the caller's
 * rig resolves (`rig`), or the humanoid tables' (`swingTwistRange.of`): a `swing` fault by the degrees its direction lies past
 * the reach of its flexion and abduction ranges, then a `twist` fault by the
 * degrees its turn about its own axis lies past `swingTwist.twist`. A
 * non-finite angle is reported as above and nothing else is measured. A bone
 * with no axes in that frame keeps the three-angle scan.
 *
 * @param joint Joint angles in the constraint's degree frame; `null` is rest.
 * @param constraint Finite ordered axis intervals and an optional swing cone.
 * @param report Called once per fault with the faulted part, the measured
 *   value in degrees and its overshoot in degrees, `undefined` for a
 *   non-finite value.
 * @param rig The bone's frame as the caller's rig resolves it (`swingTwistRange.of(bone, skeleton)`); the humanoid tables' when absent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who reads the scan and why it builds no message, the report order, what `null`, `0` and a non-finite angle mean on each kind of axis, how each overshoot is measured, the swing coupling, and each callback argument's unit.
 * @evidence contracts/development/implementation.md#principled-implementation An interval's overshoot is the distance to its nearer bound and an immobile axis's is the whole angle, the distances a clamp would move the joint; the swing is measured by `swingConeAngle` on the rotation the renderer reads, so a resting axis counts as its actual 0.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private scan body owns every fault rule. This entry keeps its callback/void interface for validation and audits, while the companion numeric entry serves solver scores through that same body; only fault emission chooses reporting or ordered summation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance is added and no bone or axis is special-cased; a non-finite angle is reported without a distance instead of being scored as zero or clamped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three axis checks and an optional cone angle remain fixed work without records or collector closures. Swing-twist retains its actual rotation, reading and existing radius-table lookup; its finite check uses three ordered reads without an array callback. Both entries add one fixed core call, and fault dispatch adds one fixed helper call; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Callback reports and scalar solver scores share the same actual scan and fault order; no second pass, candidate memo, target result or numerical rule is duplicated.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; faults leave through the caller's callback.
 */
export function scanJointRom(
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  report: (
    part: scanJointRom.Part,
    actual: number,
    overshoot: number | undefined,
  ) => void,
  rig?: swingTwistRange.IJoint,
): void {
  scan(joint, constraint, report, rig, false);
}

/**
 * One unchanged fault scan, reporting faults or folding their ordered distances.
 * The explicit mode keeps an invalid required public callback failing at its
 * original first fault rather than treating its absence as numeric mode.
 */
function scan(
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  report: Parameters<typeof scanJointRom>[2] | undefined,
  rig: swingTwistRange.IJoint | undefined,
  score: boolean,
  compose?: (joint: IAutoMovieJointPose) => IAutoMovieQuaternion,
): number {
  let total: number = 0;

  // A ball joint gated by swing and twist reads its rotation, not its three
  // angles: the swing past the reach of its flexion and abduction ranges,
  // then the twist past its interval, in the frame its clinical angles are
  // written in: the caller's rig's, or the humanoid tables'.
  const range: swingTwistRange.IJoint | undefined =
    constraint.swingTwist === undefined || constraint.swingTwist === null
      ? undefined
      : (rig ?? swingTwistRange.of(joint.bone));
  if (
    range !== undefined &&
    constraint.swingTwist !== undefined &&
    constraint.swingTwist !== null
  ) {
    for (const axis of AXES) {
      const angle: number | null = joint[axis];
      if (angle !== null && !Number.isFinite(angle))
        total = fault(total, report, score, axis, angle, undefined);
    }
    if (
      !Number.isFinite(joint.flexion ?? 0) ||
      !Number.isFinite(joint.abduction ?? 0) ||
      !Number.isFinite(joint.twist ?? 0)
    )
      return total;
    const reading: swingTwistRange.IReading = swingTwistRange.read(
      compose === undefined
        ? jointToQuaternion(joint, range.axes, range.frame)
        : compose(joint),
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
    const twist: IAutoMovieAngleRange = constraint.swingTwist.twist;
    const turned: number = nearestAngleAlias(reading.twist, twist);
    if (turned < twist.min)
      total = fault(total, report, score, "twist", turned, twist.min - turned);
    else if (turned > twist.max)
      total = fault(total, report, score, "twist", turned, turned - twist.max);
    return total;
  }
  for (const axis of AXES) {
    const angle: number | null = joint[axis];
    const allowed: IAutoMovieAngleRange | null = constraint[axis];
    if (angle === null) continue;
    // 0 is only implicitly fine on an IMMOBILE axis (it is that axis's rest);
    // against a zero-excluding override like [10, 90] it must report, or
    // validate would call clean what clampJointRom moves to the min (#1057)
    if (angle === 0 && allowed === null) continue;
    if (!Number.isFinite(angle))
      total = fault(total, report, score, axis, angle, undefined);
    // immobile axis: the gap is the whole distance from the required 0
    else if (allowed === null)
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

/** Preserve actual callback effects, or add one score in the original report order. */
function fault(
  total: number,
  report: Parameters<typeof scanJointRom>[2] | undefined,
  score: boolean,
  part: scanJointRom.Part,
  actual: number,
  overshoot: number | undefined,
): number {
  if (!score) {
    report!(part, actual, overshoot);
    return total;
  }
  return total + (overshoot ?? Number.POSITIVE_INFINITY);
}

/**
 * Companion declarations of {@link scanJointRom}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the reported-part type and the same scanner's ordered numeric-score entry, with nonfinite faults scored as Infinity.
 * @evidence contracts/development/design.md#principled-representation Callback fault identity and a scalar sum are two observations of the same ROM scan; neither introduces another constraint or verdict representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The existing validation/audit callback and jointRomOvershoot's actual score consumer share one private scan through these two entries and one reported-part type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No second ROM rule, candidate memo, tolerance or alternate fault order is introduced; public callback behavior and void return remain unchanged.
 */
export namespace scanJointRom {
  /**
   * What a fault is measured on: one clinical axis, or the combined swing.
   *
   * A closed union of the three clinical axes and their combined swing, one
   * literal for each reported check. The gate maps it to a message and audits
   * to a fault location; it remains exhaustively checkable rather than string.
   */
  export type Part = "flexion" | "abduction" | "twist" | "swing";

  /**
   * Sum the same faults in their report order, without a collector closure.
   * Missing distances are nonfinite faults and add Infinity, never zero.
   * This entry runs the same full scan with its existing rig admission and
   * owns only a local number; it retains no joint, constraint or result.
   *
   * @param joint The actual clinical angles, degrees.
   * @param constraint Their effective admitted ROM.
   * @param rig The caller's existing clinical frame, when supplied.
   * @returns The ordered overshoot sum in degrees, or Infinity for an unmeasurable fault.
   */
  export function overshoot(
    joint: IAutoMovieJointPose,
    constraint: IAutoMovieJointConstraint,
    rig?: swingTwistRange.IJoint,
  ): number {
    return scan(joint, constraint, undefined, rig, true);
  }

  /**
   * Prepare numerical scans for one bone's unchanged constraint and clinical
   * frame. Every input joint must name that bone. The canonical humanoid
   * frame remains the fallback when no rig is supplied, as in a direct scan.
   * Creating the scorer admits no axis or angle; the first finite gated
   * candidate admits its basis at the original composition site. Later
   * candidates share only that basis and their pure axis factors, while all
   * finite checks, swing/twist readings and ordered additions still run.
   *
   * Preparation is constant work. One closure owns one optional prepared
   * frame and lazy joint composer for this synchronous operation, released
   * with the scorer. No joint, quaternion result or target history is cached.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed-bone input, unchanged constraint/frame scope, canonical fallback and lazy original-site numerical admission.
   * @evidence contracts/development/implementation.md#principled-implementation The same private fault scan evaluates every candidate; only the gated frame and composition factors are prepared from unchanged inputs, with finite checks before any composition as in a direct scan.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Frame/composer preparation surrounds the shared scan without duplicating finite, interval, cone or swing-twist fault rules.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the direct scanner's canonical frame fallback and original ordered additions; no changed constraint, score cache or tolerance is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and one lazy normalized basis/composer serve this operation's gated candidates; each actual candidate still performs its finite checks and swing-twist reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's unchanged bone/constraint/axes/frame prove source metadata equivalence. Pure composer factors may be shared by exact angles, while every candidate owns a fresh outer product and actual reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One scorer owns one optional prepared frame and composer with bounded axis-factor state until caller release; no joint result, target history, handle or task is retained.
   */
  export function prepare(
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint,
    rig?: swingTwistRange.IJoint,
  ): (joint: IAutoMovieJointPose) => number {
    const source: swingTwistRange.IJoint | undefined =
      constraint.swingTwist === undefined || constraint.swingTwist === null
        ? undefined
        : rig ?? swingTwistRange.of(bone);
    const range: swingTwistRange.IJoint | undefined =
      source === undefined ? undefined : swingTwistRange.prepare(source);
    let composer:
      | ReturnType<typeof jointToQuaternionOnBasis.prepare>
      | undefined;
    const compose: ((joint: IAutoMovieJointPose) => IAutoMovieQuaternion) | undefined =
      range === undefined
        ? undefined
        : (joint: IAutoMovieJointPose): IAutoMovieQuaternion => {
            if (composer === undefined) {
              const basis: IAutoMovieJointAxes | undefined =
                SwingTwistFramePreparation.normalized(
                  range,
                  "jointToQuaternion axes",
                );
              composer = jointToQuaternionOnBasis.prepare(
                basis!,
                range.frame,
              );
            }
            return composer(joint);
          };
    return (joint: IAutoMovieJointPose): number =>
      scan(joint, constraint, undefined, range, true, compose);
  }
}
