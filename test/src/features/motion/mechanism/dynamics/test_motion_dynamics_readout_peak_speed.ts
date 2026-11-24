import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../../../internal/motionAuditPoints";
import { motionHumanBody } from "../../../internal/motionHumanBody";
import { nclose } from "../../../internal/nclose";

/**
 * Peak hand speed is measured in metres per second over the centred readout
 * interval.
 *
 * Scenarios:
 *
 * 1. Read the public measure on the declared input and its control.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Peak hand speed is measured in metres per second over the centred readout interval.
 * @evidence contracts/development/testing.md#independent-expectations The sine difference across a centred 1/240-second radius equals twenty-four times sine of 2π/240. A ten-centimetre step crosses that interval at twelve metres per second.
 * @evidence contracts/development/testing.md#distinguishing-cases The temporal boundary distinguishes admitted and excluded observations.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_readout_peak_speed(): void {
  const peak = (position: (t: number) => number): number =>
    HumanSignature.speed(
      HumanSignature(
        motionAuditPoints(2, (t: number) => ({
          rightHand: { x: position(t), y: 1, z: 0 },
        })),
        "a",
        motionHumanBody("m-average"),
        0,
      ),
      "rightHand",
      0,
      1,
    );
  TestValidator.predicate(
    "sinusoidal velocity",
    nclose(
      peak((t) => 0.1 * Math.sin(2 * Math.PI * t)),
      24 * Math.sin((2 * Math.PI) / 240),
      1e-9,
    ),
  );
  TestValidator.predicate(
    "step displacement per centred interval",
    nclose(
      peak((t) => (t < 0.5 ? 0 : 0.1)),
      12,
      1e-9,
    ),
  );
  TestValidator.predicate("static marker", peak(() => 3) === 0);
}
