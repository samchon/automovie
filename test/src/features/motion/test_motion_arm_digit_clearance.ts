import { createCyclingHelmet } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The arm planner keeps a hand's digits clear of the performer's own body.
 *
 * Scenarios:
 * 1. A helmet held beside the right hip is taken up: the gripping
 *    hand's thumb and fingers stay clear of the hips and the thigh (the
 *    take passes the verdicts, which read every digit).
 * 2. A helmet whose hold lies inside the hip cannot be gripped clear: the
 *    arm planner refuses it, and a refusal that names a probe names the
 *    digit that probe rides.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two cases and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp through the public performance and reads the verdicts and the refusal.
 * @evidence contracts/development/testing.md#independent-expectations The tangle verdict reads every digit; the refusal's words name the probe's bone.
 * @evidence contracts/development/testing.md#distinguishing-cases A reachable clear grip and one inside the body.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of a generated body and an archetype.
 */
export function test_motion_arm_digit_clearance(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const take: (at: IAutoMovieVector3) => HumanPerformance = (
    at: IAutoMovieVector3,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "digit-clearance",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("box", createCyclingHelmet({}, 1), {
          position: at,
          rotation: Quaternion.identity(),
        }),
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .pickUp({ prop: "box", handle: "hold", hand: "right" }).node,
    });
  const hip: number = body.measure.hipHeight;
  assertTakeClean(
    "a helmet beside the hip is taken up with the digits clear",
    take({ x: -0.32, y: hip - 0.1, z: 0.12 }),
  );

  let refusal: unknown;
  try {
    // The hold itself at the right hip joint, inside the pelvis.
    const hold: IAutoMovieVector3 = createCyclingHelmet({}, 1).affordances.find(
      (a): boolean => a.id === "hold",
    )!.frame.translation;
    take({
      x: -body.measure.hipHalfWidth - hold.x,
      y: hip - hold.y,
      z: -hold.z,
    });
  } catch (error: unknown) {
    refusal = error;
  }
  // Refused by the arm's own clearance; a refusal that names a probe
  // names the digit it rides.
  TestValidator.predicate(
    `a grip inside the hip is refused by the arm's clearance (${refusal instanceof Error ? refusal.message : "taken"})`,
    refusal instanceof HumanRefusal &&
      refusal.axis === "region" &&
      (!/probe/.test(refusal.reason) ||
        /(Thumb|Index|Middle|Ring|Little)/.test(refusal.reason)),
  );
}
