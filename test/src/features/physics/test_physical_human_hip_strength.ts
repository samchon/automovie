import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalProfile,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The canonical Human's hips are as strong in abduction, adduction and rotation
 * as measured adults, not the unsourced placeholder:
 *
 * 1. Each hip's abduction drive pushes toward abduction with 1.29 N m/kg and
 *    toward adduction with 1.08 N m/kg of body mass, and its rotation drive
 *    toward external rotation with 0.66 and internal with 0.72 N m/kg (McNabb
 *    et al. 2024, PLoS ONE 19(8):e0308956, Table 5), each direction its own
 *    bound.
 * 2. No hip axis keeps the placeholder of 50 N m per downstream kilogram,
 *    several times a hip's measured strength.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the measured strengths, their source and the placeholder they replace.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the canonical provider's profile and reads its hip joints' axis bounds.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the published per-kilogram means times the subject's mass, and the placeholder's rate times the leg's own segment masses.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates abduction from adduction and external from internal rotation by each axis's coordinate sign, and both hips.
 * @evidence contracts/development/testing.md#execution-ownership The portable unit test prepares the installed canonical body in memory; no native world, viewer or file host.
 */
export function test_physical_human_hip_strength(): void {
  const profile: IAutoMoviePhysicalProfile =
    motionHumanBody("m-average").profile;
  const failures: string[] = [];
  const measured: Record<string, [number, number]> = {
    abduction: [1.29, 1.08],
    twist: [0.66, 0.72],
  };
  for (const side of ["left", "right"]) {
    const joint: IAutoMoviePhysicalJoint | undefined = profile.joints.find(
      (candidate: IAutoMoviePhysicalJoint): boolean =>
        candidate.child === `${side}UpperLeg`,
    );
    if (!joint) {
      failures.push(`no ${side} hip`);
      continue;
    }
    // The leg's own mass: the thigh and every segment it carries.
    const carried: Set<string> = new Set([joint.child]);
    for (const next of profile.joints)
      if (carried.has(next.parent)) carried.add(next.child);
    const leg: number = profile.segments
      .filter((segment): boolean => carried.has(segment.bone))
      .reduce((sum: number, segment): number => sum + segment.mass, 0);
    for (const [channel, [toMaximum, toMinimum]] of Object.entries(measured)) {
      const axis: IAutoMoviePhysicalJointAxis | undefined = joint.axes.find(
        (candidate: IAutoMoviePhysicalJointAxis): boolean =>
          candidate.channel === `${side}UpperLeg.${channel}`,
      );
      if (!axis) {
        failures.push(`${side} hip has no ${channel} axis`);
        continue;
      }
      const up: number = axis.maximumTorque;
      const down: number = axis.reverseTorque ?? axis.maximumTorque;
      const [toward, away] =
        (axis.coordinateSign ?? 1) > 0 ? [up, down] : [down, up];
      if (
        !(Math.abs(toward - toMaximum * profile.mass) < 1e-6) ||
        !(Math.abs(away - toMinimum * profile.mass) < 1e-6)
      )
        failures.push(
          `${side} hip ${channel}: ${toward} and ${away} N m, not ${toMaximum * profile.mass} and ${toMinimum * profile.mass}`,
        );
    }
    for (const axis of joint.axes)
      if (
        Math.abs(axis.maximumTorque - 50 * leg) < 1 ||
        Math.abs((axis.reverseTorque ?? 0) - 50 * leg) < 1
      )
        failures.push(`${side} hip ${axis.channel} keeps the placeholder`);
  }
  TestValidator.equals("human hip strength", failures, []);
}
