import {
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";

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
 * @param joint Joint angles in the constraint's degree frame; `null` is rest.
 * @param constraint Finite ordered axis intervals and an optional swing cone.
 * @param report Called once per fault with the faulted part, the measured
 *   value in degrees and its overshoot in degrees, `undefined` for a
 *   non-finite value.
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

/** Companion declarations of {@link scanJointRom}. */
export namespace scanJointRom {
  /** What a fault is measured on: one clinical axis, or the combined swing. */
  export type Part = "flexion" | "abduction" | "twist" | "swing";
}
