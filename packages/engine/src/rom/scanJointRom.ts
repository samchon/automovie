import {
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";

import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { HUMANOID_REST_FRAME } from "./constants/HUMANOID_REST_FRAME";
import { swingConeAngle } from "./swingConeAngle";

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
 * rotation instead (`swingTwistRange`), with the humanoid's axes and rest
 * frame for its bone: a `swing` fault by the degrees its direction lies past
 * the reach of its flexion and abduction ranges, then a `twist` fault by the
 * degrees its turn about its own axis lies past `swingTwist.twist`. A
 * non-finite angle is reported as above and nothing else is measured. A bone
 * the humanoid tables do not name keeps the three-angle scan.
 *
 * @param joint Joint angles in the constraint's degree frame; `null` is rest.
 * @param constraint Finite ordered axis intervals and an optional swing cone.
 * @param report Called once per fault with the faulted part, the measured
 *   value in degrees and its overshoot in degrees, `undefined` for a
 *   non-finite value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who reads the scan and why it builds no message, the report order, what `null`, `0` and a non-finite angle mean on each kind of axis, how each overshoot is measured, the swing coupling, and each callback argument's unit.
 * @evidence contracts/development/implementation.md#principled-implementation An interval's overshoot is the distance to its nearer bound and an immobile axis's is the whole angle, the distances a clamp would move the joint; the swing is measured by `swingConeAngle` on the rotation the renderer reads, so a resting axis counts as its actual 0.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of what a ROM fault is: the gate words its reports and the solvers sum them, so the two cannot judge by different rules; one loop over the three axes and one cone check.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance is added and no bone or axis is special-cased; a non-finite angle is reported without a distance instead of being scored as zero or clamped.
 * @evidence contracts/development/implementation.md#efficient-algorithms A three-angle joint costs three comparisons and at most one cone angle, with no allocation. A swing-twist joint costs one rotation, one reading and one table lookup, with a few small records allocated; the radius table behind the lookup is built once per constraint and basis (`swingTwistRange.radius` caches it, 360 rays each scanned in half-degree steps and bisected) and every later call reads it. Both matter because a limb fit scans hundreds of candidates per solve.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure scan of one joint and constraint that coordinates no work across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; faults leave through the caller's callback.
 */
export const scanJointRom: (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  report: (
    part: scanJointRom.Part,
    actual: number,
    overshoot: number | undefined,
  ) => void,
) => void = (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  report: (
    part: scanJointRom.Part,
    actual: number,
    overshoot: number | undefined,
  ) => void,
): void => {
  // A ball joint gated by swing and twist reads its rotation, not its three
  // angles: the swing past the reach of its flexion and abduction ranges,
  // then the twist past its interval. Its axes and rest frame are the
  // humanoid's own tables, the frame its clinical angles are written in.
  if (
    constraint.swingTwist !== undefined &&
    constraint.swingTwist !== null &&
    HUMANOID_JOINT_AXES[joint.bone] !== undefined
  ) {
    for (const axis of AXES) {
      const angle: number | null = joint[axis];
      if (angle !== null && !Number.isFinite(angle))
        report(axis, angle, undefined);
    }
    if (AXES.some((axis): boolean => !Number.isFinite(joint[axis] ?? 0)))
      return;
    const range: swingTwistRange.IJoint = {
      axes: HUMANOID_JOINT_AXES[joint.bone]!,
      frame: HUMANOID_REST_FRAME[joint.bone],
    };
    const reading: swingTwistRange.IReading = swingTwistRange.read(
      jointToQuaternion(joint, range.axes, range.frame),
      range,
    );
    const reach: number = swingTwistRange.radius(
      constraint,
      range,
      reading.azimuth,
    );
    if (reading.swing > reach)
      report("swing", reading.swing, reading.swing - reach);
    const twist: IAutoMovieAngleRange = constraint.swingTwist.twist;
    const turned: number =
      reading.twist -
      360 * Math.round((reading.twist - (twist.min + twist.max) / 2) / 360);
    if (turned < twist.min) report("twist", turned, twist.min - turned);
    else if (turned > twist.max) report("twist", turned, turned - twist.max);
    return;
  }
  for (const axis of AXES) {
    const angle: number | null = joint[axis];
    const allowed: IAutoMovieAngleRange | null = constraint[axis];
    if (angle === null) continue;
    // 0 is only implicitly fine on an IMMOBILE axis (it is that axis's rest);
    // against a zero-excluding override like [10, 90] it must report, or
    // validate would call clean what clampJointRom moves to the min (#1057)
    if (angle === 0 && allowed === null) continue;
    if (!Number.isFinite(angle)) report(axis, angle, undefined);
    // immobile axis: the gap is the whole distance from the required 0
    else if (allowed === null) report(axis, angle, Math.abs(angle));
    else if (angle < allowed.min) report(axis, angle, allowed.min - angle);
    else if (angle > allowed.max) report(axis, angle, angle - allowed.max);
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
      report("swing", swing, swing - constraint.swingDeg);
  }
};

/**
 * Companion declarations of {@link scanJointRom}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names what the namespace holds; its one member states what each value stands for.
 * @evidence contracts/development/design.md#principled-representation Holds the one type the scan's callback needs, the part a fault is measured on.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One type, declared beside the function whose callback takes it and read by its two callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No cast, no index signature and no copy of a type owned elsewhere.
 */
export namespace scanJointRom {
  /**
   * What a fault is measured on: one clinical axis, or the combined swing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two kinds of part a fault can name.
   * @evidence contracts/development/design.md#principled-representation A closed union of the three clinical axis names a joint pose carries and `swing`, the coupling of flexion and abduction that belongs to no single axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four literals, one for each check the scan runs; the gate maps each to its message and the ranking ignores it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts String literals rather than `string`, so a caller's switch over the parts is checked for exhaustiveness.
   */
  export type Part = "flexion" | "abduction" | "twist" | "swing";
}
