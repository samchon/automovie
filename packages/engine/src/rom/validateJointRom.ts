import {
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { scanJointRom } from "./scanJointRom";

/**
 * Append axis range/ROM violations and a combined swing violation to the caller's collector. Null angles mean rest and contribute zero to swing; immobile axes admit null/zero. Field paths and degree overshoots preserve correction provenance, while constraint admission is separate.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Report nonfinite, interval and immobile-axis violations in axis order, then combined swing with null as zero; the collector retains paths, actual values and degree overshoots. A joint whose constraint declares `swingTwist` is reported by `scanJointRom` as a `swing` fault past the reach of its flexion and abduction ranges and a `twist` fault past the swing-twist interval, worded here for those two; the measure is `scanJointRom`'s, so the gate and the solvers cannot disagree.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Axis and cone detection share projection owners' semantics/angular metric while the caller's collector owns diagnostics.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Null is rest and zero is automatically valid only for immobile axes; constraint admission and periodic multi-turn limitations are separate rather than hidden here.
 * @evidence contracts/development/common.md#meaningful-documentation Props state joint/constraint/path/collector roles and degree overshoots; nonfinite angles produce range diagnostics before axis comparison.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three fixed axis checks plus one swing metric use constant work and append at most four rows; a ball joint gated by `swingTwist` appends at most two (swing, twist) after one lookup in the radius table that `swingTwistRange` builds once per constraint and basis and caches.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Detector/clamps share admitted constraints/metric, while collector effects are appended anew rather than cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns collector rows and release lifetime; joint/constraint references are borrowed and no handle or task is acquired.
 */
export const validateJointRom: (props: {
  joint: IAutoMovieJointPose;
  constraint: IAutoMovieJointConstraint;
  path: string;
  collector: ViolationCollector;
}) => void = (props: {
  /** Borrowed joint angles in the constraint's degree frame; null means rest. */
  joint: IAutoMovieJointPose;

  /** Admitted finite ordered axis intervals and optional coupled swing policy. */
  constraint: IAutoMovieJointConstraint;

  /** Base JSON address; axis or swing suffixes identify each reported fault. */
  path: string;

  /** Caller-owned append-only diagnostic sink, advanced by this validation. */
  collector: ViolationCollector;
}): void => {
  const {
    joint,
    constraint,
    path,
    collector,
  }: {
    joint: IAutoMovieJointPose;
    constraint: IAutoMovieJointConstraint;
    path: string;
    collector: ViolationCollector;
  } = props;
  // The faults and their distances come from `scanJointRom`, the measure the
  // solvers rank candidates by; only their wording is decided here.
  scanJointRom(
    joint,
    constraint,
    (
      part: scanJointRom.Part,
      actual: number,
      overshoot: number | undefined,
    ): void => {
      const swingTwist: IAutoMovieJointConstraint.ISwingTwist | null =
        constraint.swingTwist ?? null;
      if (swingTwist !== null && overshoot !== undefined) {
        collector.push(
          "rom",
          `${path}.${part}`,
          part === "swing"
            ? `${joint.bone} must point where its flexion and abduction ranges reach, but points ${actual.toFixed(1)}° from rest, ${overshoot.toFixed(1)}° past that reach on its great circle`
            : `${joint.bone} turn about its own axis must be within [${swingTwist.twist.min}, ${swingTwist.twist.max}]° from its rest (swing and twist), but was ${actual.toFixed(1)} (${overshoot.toFixed(1)}° past limit)`,
          actual,
          overshoot,
        );
        return;
      }
      if (part === "swing") {
        collector.push(
          "rom",
          `${path}.swing`,
          `${joint.bone} combined flexion+abduction swing must be within ${constraint.swingDeg}° of neutral (the joint's reachable cone), but was ${actual.toFixed(1)}° (${overshoot!.toFixed(1)}° past the cone)`,
          actual,
          overshoot,
        );
        return;
      }
      const allowed: IAutoMovieAngleRange | null = constraint[part];
      if (overshoot === undefined)
        collector.push(
          "range",
          `${path}.${part}`,
          `${joint.bone} ${part} must be finite or null, but was ${actual}`,
          actual,
        );
      else if (allowed === null)
        collector.push(
          "rom",
          `${path}.${part}`,
          `${joint.bone} does not move in ${part}; this axis must be null or 0, but was ${actual} (${overshoot}° off)`,
          actual,
          overshoot,
        );
      else
        collector.push(
          "rom",
          `${path}.${part}`,
          `${joint.bone} ${part} must be within [${allowed.min}, ${allowed.max}]° (anatomical ROM), but was ${actual} (${overshoot}° past limit)`,
          actual,
          overshoot,
        );
    },
  );
};
