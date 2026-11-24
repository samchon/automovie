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

import { assertTakeClean } from "../../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * The arm planner keeps a hand's digits clear of the performer's own body.
 *
 * Scenarios:
 * 1. A helmet held beside the right hip is taken up: the gripping
 *    hand's thumb and fingers stay clear of the hips and the thigh (the
 *    take passes the verdicts, which read every digit).
 * 2. A helmet whose hold lies inside the hip cannot be gripped clear: the
 *    arm planner refuses it, and every probe the refusal names is named by
 *    what it rides: a digit's probe by the digit, an arm probe by its
 *    segment, never as the hand's.
 * 3. A helmet whose hold lies 55 mm outside the hip's half width, 0.1 m
 *    below the hip joint, brings the thumb across the thigh as the hand
 *    reaches it: the arm planner either takes it up with every digit clear
 *    (the verdicts) or refuses it, the refusal naming a digit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three cases and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp through the public performance and reads the verdicts and the refusal.
 * @evidence contracts/development/testing.md#independent-expectations The tangle verdict reads every digit; the refusal's words name each probe's rider, a digit's bone or an arm segment, as nameArmTrajectoryPair documents; a digit the reach drives into the thigh is the planner's to clear or to refuse, by the same skin the verdict reads.
 * @evidence contracts/development/testing.md#distinguishing-cases A reachable clear grip, one inside the body, and one whose reach crosses the thigh with a digit.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of a generated body and an archetype.
 */
export function test_motion_mechanism_arm_digit_clearance(): void {
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
        .stand({ hold: 0.3 })
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
  // Refused by the arm's own clearance; every probe the refusal names is
  // named by the bone it rides (`nameArmTrajectoryPair`): a probe on a
  // digit by the digit's own bone, never as a probe of the hand or the arm
  // that rides a digit.
  const riders: readonly Rider[] =
    refusal instanceof HumanRefusal
      ? [
          ...refusal.reason.matchAll(
            /the ([A-Za-z ]+?)'s probe \d+(?: \(on ([A-Za-z]+)\))?/g,
          ),
        ].map(
          (match: RegExpMatchArray): Rider => [match[1]!, match[2]],
        )
      : [];
  TestValidator.predicate(
    `a grip inside the hip is refused by the arm's clearance (${refusal instanceof Error ? refusal.message : "taken"})`,
    refusal instanceof HumanRefusal &&
      refusal.axis === "region" &&
      riders.every(
        ([, bone]: Rider): boolean =>
          bone === undefined || !/(Thumb|Index|Middle|Ring|Little)/.test(bone),
      ),
  );

  // The reach to a hold just outside the thigh crosses it with the thumb:
  // either every digit is kept clear, or the refusal names the digit.
  let crossing: unknown;
  let clean: boolean = false;
  try {
    const hold: IAutoMovieVector3 = createCyclingHelmet({}, 1).affordances.find(
      (a): boolean => a.id === "hold",
    )!.frame.translation;
    assertTakeClean(
      "a reach past the thigh keeps the digits clear",
      take({
        x: -body.measure.hipHalfWidth - 0.055 - hold.x,
        y: hip - 0.1 - hold.y,
        z: -hold.z,
      }),
    );
    clean = true;
  } catch (error: unknown) {
    crossing = error;
  }
  TestValidator.predicate(
    `a digit crossing the thigh is cleared or refused by name (${crossing instanceof Error ? crossing.message : "clear"})`,
    clean ||
      (crossing instanceof HumanRefusal &&
        /(Thumb|Index|Middle|Ring|Little)/.test(crossing.reason)),
  );
}

/** A probe a refusal names: the part it is named by and the bone it rides, when the words give one apart from that part. */
type Rider = readonly [string, string | undefined];
