import { HumanChain } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../../features/internal/motionHumanLaw";

/**
 * Playing one crouch at twice its pace halves event times, preserves equal-phase posture, and doubles velocity.
 *
 * Scenarios:
 * 1. Match each named event between the usual and double-pace plans.
 * 2. During the descent compare root height and centred vertical velocity at equal fractions of the plan.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the sampled root, time unit and expected pace relationship.
 * @evidence contracts/development/testing.md#behavioral-verification Plans two public crouches and samples each action's own timed posture.
 * @evidence contracts/development/testing.md#independent-expectations Replacing time by twice time preserves phase and doubles its derivative by the chain rule.
 * @evidence contracts/development/testing.md#distinguishing-cases Reads all named instants and a moving sample in the descent.
 * @evidence contracts/development/testing.md#execution-ownership Uses a single prepared body and two bouts of the same action.
 */
export function test_motion_posture_time_scaled_posture(): void {
  const body = motionHumanBody("m-average");
  const run = (pace: number) =>
    motionHumanLaw
      .perform(
        "metamorphic",
        [{ subject: "a", body }],
        HumanChain.subject("a").crouch({ hold: 0.5, manner: { pace } }),
      )
      .performance.segments("a")[0]!.plan;
  const usual = run(1);
  const fast = run(2);
  TestValidator.predicate(
    "duration scales to one half",
    Math.abs(2 * fast.duration - usual.duration) <= 0.01 * usual.duration,
  );
  TestValidator.equals(
    "event identities",
    fast.events.map((e) => e.name),
    usual.events.map((e) => e.name),
  );
  for (let index = 0; index < usual.events.length; index++) {
    const u = usual.events[index]!;
    const v = fast.events[index]!;
    TestValidator.predicate(
      u.name + " scales in seconds",
      Math.abs(2 * v.share * fast.duration - u.share * usual.duration) <=
        0.01 * usual.duration,
    );
  }
  const height = (plan: typeof usual, t: number): number =>
    plan.posture(t).root.y;
  const phase: number =
    (usual.events.find((event) => event.share > 0)?.share ?? 1) / 2;
  const delta: number = 1e-4;
  const slope = (plan: typeof usual): number =>
    (height(plan, (phase + delta) * plan.duration) -
      height(plan, (phase - delta) * plan.duration)) /
    (2 * delta * plan.duration);
  const velocity: number = slope(usual);
  const minimumDownwardSpeed: number = 1e-6;
  TestValidator.predicate(
    "root descends at the sampled phase: " + velocity + " m/s",
    -velocity > minimumDownwardSpeed,
  );
  TestValidator.predicate(
    "equal-phase root height at " + phase,
    Math.abs(
      height(fast, phase * fast.duration) -
        height(usual, phase * usual.duration),
    ) <= 1e-6,
  );
  TestValidator.predicate(
    "vertical velocity " + slope(fast) + " versus " + 2 * velocity,
    Math.abs(slope(fast) - 2 * velocity) <= 0.01 * Math.abs(2 * velocity),
  );
}
