import {
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  type IAutoMovieScanJointRom,
  type IAutoMovieSwingTwistLimit,
  type IAutoMovieValidateJointRom,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { swingTwistRange } from "../kinematics/swingTwistRange";
import { abductionRange } from "./abductionRange";
import { scanJointRom } from "./scanJointRom";

/**
 * Append axis range/ROM violations and a combined swing violation to the
 * caller's collector. Null angles mean rest and contribute zero to swing;
 * immobile axes admit null/zero. Field paths and degree overshoots preserve
 * correction provenance, while constraint admission is separate.
 */
export const validateJointRom: (
  props: IAutoMovieValidateJointRom.IProps,
) => void = (props: IAutoMovieValidateJointRom.IProps): void => {
  const {
    joint,
    constraint,
    path,
    collector,
  }: {
    joint: IAutoMovieJointPose;
    constraint: IAutoMovieJointConstraint;
    path: string;
    collector: IAutoMovieViolationCollector;
  } = props;
  // The faults and their distances come from `scanJointRom`, the measure the
  // solvers rank candidates by; only their wording is decided here.
  scanJointRom(
    joint,
    constraint,
    (
      part: IAutoMovieScanJointRom.Part,
      actual: number,
      overshoot: number | undefined,
    ): void => {
      const swingTwist: IAutoMovieSwingTwistLimit | null =
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
      const allowed: IAutoMovieAngleRange | null =
        part === "abduction"
          ? abductionRange(constraint, joint.flexion)
          : constraint[part];
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
    props.rig === undefined ||
      constraint.swingTwist === undefined ||
      constraint.swingTwist === null
      ? undefined
      : swingTwistRange.prepare(joint.bone, props.rig, constraint),
  );
};
