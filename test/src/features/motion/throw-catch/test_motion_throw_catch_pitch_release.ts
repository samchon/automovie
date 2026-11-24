import { createBall } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A sports pitch transfers a held ball to flight at release.
 *
 * Scenarios:
 *
 * 1. Cocked elbow flexion precedes extension and a planted forward lean at
 *    release.
 * 2. The released ball departs the hand independently.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed joints, support and ball position.
 * @evidence contracts/development/testing.md#independent-expectations Uses the throwing signature's anatomical angle bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares a hand-held instant with free flight.
 * @evidence contracts/development/testing.md#execution-ownership Composes one sports pitch.
 * @evidence contracts/development/common.md#meaningful-documentation Names the release and anatomical criteria.
 */
export function test_motion_throw_catch_pitch_release(): void {
  const body = motionHumanBody("m-average");
  const performance = new HumanPerformance({
    seed: "pitch",
    laws: [AutoMovieMotionHumanThrowCatch.HumanSportThrow.pitch],
    props: [
      HumanObject.prop("ball", createBall({ kind: "handball" }), {
        at: { x: -0.25, y: 0.9, z: 0.35 },
        yaw: 0,
      }),
    ],
    performers: [
      {
        subject: "pitcher",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("pitcher")
      .pickUp({ prop: "ball", handle: "grip" })
      .registered("pitch", {
        target: { kind: "point", frame: "world", at: { x: 0, y: 1, z: 10 } },
        prop: "ball",
      }).node,
  });
  const reader = HumanSignature(performance, "pitcher", body, 0),
    segment = performance.segments("pitcher")[1]!;
  const event = (name: string): number =>
    segment.start +
    segment.plan.events.find((e) => e.name === name)!.share *
      segment.plan.duration;
  const cocked = HumanSignature.elbow(reader, event("cocked"), "right"),
    release = event("release");
  TestValidator.predicate(
    "elbow extends into release",
    cocked >= 60 &&
      cocked <= 120 &&
      HumanSignature.elbow(reader, release, "right") <= 45,
  );
  TestValidator.predicate(
    "thrower leans and bears at release",
    HumanSignature.trunk(reader, release) >= 5 &&
      (HumanSignature.bears(reader, release, "left") ||
        HumanSignature.bears(reader, release, "right")),
  );
  TestValidator.equals(
    "one free flight",
    performance.flights("ball").length,
    1,
  );
  TestValidator.predicate(
    "ball leaves hand",
    Vector3.length(
      Vector3.subtract(
        performance.prop("ball", performance.duration).position,
        performance.bones("pitcher", performance.duration).get("rightHand")!
          .worldPosition,
      ),
    ) > body.measure.hand,
  );
}
