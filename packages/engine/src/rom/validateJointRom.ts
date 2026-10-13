import {
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { swingConeAngle } from "./swingConeAngle";

const AXES: readonly ["flexion", "abduction", "twist"] = ["flexion", "abduction", "twist"] as const;

/**
 * Append axis range/ROM violations and a combined swing violation to the caller's collector. Null angles mean rest and contribute zero to swing; immobile axes admit null/zero. Field paths and degree overshoots preserve correction provenance, while constraint admission is separate.
 *
 * @evidence contracts/common.md#principled-implementation Report nonfinite, interval and immobile-axis violations in axis order, then combined swing with null as zero; the collector retains paths, actual values and degree overshoots.
 * @evidence contracts/common.md#clear-and-simple-design Axis and cone detection share projection owners' semantics/angular metric while the caller's collector owns diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null is rest and zero is automatically valid only for immobile axes; constraint admission and periodic multi-turn limitations are separate rather than hidden here.
 * @evidence contracts/common.md#meaningful-documentation Props state joint/constraint/path/collector roles and degree overshoots; nonfinite angles produce range diagnostics before axis comparison.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed axis checks plus one swing metric use constant work and append at most four rows.
 * @evidence contracts/performance.md#reuse-equivalent-work Detector/clamps share admitted constraints/metric, while collector effects are appended anew rather than cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns collector rows and release lifetime; joint/constraint references are borrowed and no handle or task is acquired.
 */
export const validateJointRom: (props: { joint: IAutoMovieJointPose; constraint: IAutoMovieJointConstraint; path: string; collector: ViolationCollector; }) => void = (props: {
  /** Borrowed joint angles in the constraint's degree frame; null means rest. */
  joint: IAutoMovieJointPose;

  /** Admitted finite ordered axis intervals and optional coupled swing policy. */
  constraint: IAutoMovieJointConstraint;

  /** Base JSON address; axis or swing suffixes identify each reported fault. */
  path: string;

  /** Caller-owned append-only diagnostic sink, advanced by this validation. */
  collector: ViolationCollector;
}): void => {
  const { joint, constraint, path, collector }: { joint: IAutoMovieJointPose; constraint: IAutoMovieJointConstraint; path: string; collector: ViolationCollector; } = props;
  for (const axis of AXES) {
    const angle: number | null = joint[axis];
    const allowed: IAutoMovieAngleRange | null = constraint[axis];
    if (angle === null) continue;
    // 0 is only implicitly fine on an IMMOBILE axis (it is that axis's rest);
    // against a zero-excluding override like [10, 90] it must report, or
    // validate would call clean what clampJointRom moves to the min (#1057)
    if (angle === 0 && allowed === null) continue;
    if (!Number.isFinite(angle)) {
      collector.push(
        "range",
        `${path}.${axis}`,
        `${joint.bone} ${axis} must be finite or null, but was ${angle}`,
        angle,
      );
      continue;
    }
    if (allowed === null) {
      // immobile axis: the gap is the whole distance from the required 0
      const overshoot: number = Math.abs(angle);
      collector.push(
        "rom",
        `${path}.${axis}`,
        `${joint.bone} does not move in ${axis}; this axis must be null or 0, but was ${angle} (${overshoot}° off)`,
        angle,
        overshoot,
      );
      continue;
    }
    if (angle < allowed.min || angle > allowed.max) {
      const overshoot: number =
        angle < allowed.min ? allowed.min - angle : angle - allowed.max;
      collector.push(
        "rom",
        `${path}.${axis}`,
        `${joint.bone} ${axis} must be within [${allowed.min}, ${allowed.max}]° (anatomical ROM), but was ${angle} (${overshoot}° past limit)`,
        angle,
        overshoot,
      );
    }
  }

  // Combined swing cone (ball joints): caps the corner the per-axis boxes miss.
  // The cone is a COUPLING between the two axes, not a per-axis check, so a
  // resting (`null`) axis is not exempt. It contributes its actual rotation, 0,
  // exactly as the renderer reads it (`jointToQuaternion`'s `?? 0`). Gating on
  // both axes being non-null made `{flexion:150, abduction:null}` pass while its
  // identical twin `{flexion:150, abduction:0}` (the same quaternion) failed
  // (#1245).
  if (typeof constraint.swingDeg === "number") {
    const swing: number = swingConeAngle(joint.flexion ?? 0, joint.abduction ?? 0);
    if (swing > constraint.swingDeg) {
      const overshoot: number = swing - constraint.swingDeg;
      collector.push(
        "rom",
        `${path}.swing`,
        `${joint.bone} combined flexion+abduction swing must be within ${constraint.swingDeg}° of neutral (the joint's reachable cone), but was ${swing.toFixed(1)}° (${overshoot.toFixed(1)}° past the cone)`,
        swing,
        overshoot,
      );
    }
  }
};
