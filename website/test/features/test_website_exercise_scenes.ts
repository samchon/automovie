import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PlaygroundBodies } from "../../src/playground/package/PlaygroundBodies";
import { PlaygroundPerformance } from "../../src/playground/package/PlaygroundPerformance";
import { SCENES_FIELD } from "../../src/scenes/data/SCENES_FIELD";
import { SCENES_PARTNER } from "../../src/scenes/data/SCENES_PARTNER";

/**
 * The gallery's first exercise takes play through the shared composition
 * adapter, including a physical pass and an authored paired outcome.
 *
 * Scenarios:
 * 1. One basketball leaves the passer and is secured on the receiver's side.
 * 2. Both judoka begin the exchange together and the receiver reaches the mat.
 * 3. The wrestling cast avoids joint intrusion beyond the 10 mm skin
 *    allowance at 30 Hz and at authored events, then returns upright.
 */
export function test_website_exercise_scenes(): void {
  const court: IAutoMovieMotionHumanPerformance = PlaygroundPerformance.build(
    SCENES_FIELD.find((scene) => scene.id === "shoot-around")!.composition!,
  ).performance;
  const flight: IAutoMovieMotionHumanPropFlight.IFlight =
    court.flights("ball")[0]!;
  TestValidator.equals(
    "one flight for the staged pass",
    court.flights("ball").length,
    1,
  );
  TestValidator.predicate(
    "the receiver secures the pass after release",
    flight.capturedAt !== undefined && flight.capturedAt > flight.launch,
  );
  const position: IAutoMovieVector3 = court.prop(
    "ball",
    flight.capturedAt!,
  ).position;
  TestValidator.predicate(
    "the ball reaches the receiver's side of the court",
    position.z > 3 && position.z < 4,
  );

  const mat: IAutoMovieMotionHumanPerformance = PlaygroundPerformance.build(
    SCENES_PARTNER.find((scene) => scene.id === "judo-randori")!.composition!,
  ).performance;
  const initiator: IAutoMovieMotionHumanSegment = mat
    .segments("tor")
    .find((segment) => segment.name === "grapple")!;
  const receiver: IAutoMovieMotionHumanSegment = mat
    .segments("uke")
    .find((segment) => segment.name === "grapple")!;
  TestValidator.predicate(
    "the roles start in sync",
    Math.abs(initiator.start - receiver.start) < 1e-6,
  );
  const standing: number = mat.bones("uke", 0).get("hips")!.worldPosition.y;
  const settled: number = mat.bones("uke", receiver.end).get("hips")!.worldPosition.y;
  TestValidator.predicate(
    "the receiver settles below half their standing hip height",
    settled < standing / 2,
  );

  const reset: IAutoMovieMotionHumanPerformance = PlaygroundPerformance.build(
    SCENES_PARTNER.find((scene) => scene.id === "wrestling-reset")!.composition!,
  ).performance;
  const red: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    reset,
    "red",
    PlaygroundBodies.get("m1").body,
    0,
  );
  const blue: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    reset,
    "blue",
    PlaygroundBodies.get("m2").body,
    0,
  );
  const exchange: IAutoMovieMotionHumanSegment = reset.segments("red").at(-1)!;
  const seconds: number[] = [
    ...HumanSignature.times(0, reset.duration, 30),
    ...exchange.plan.events.map(
      (event): number => exchange.start + event.share * exchange.plan.duration,
    ),
    reset.duration,
  ];
  const clearance: number = Math.min(
    ...seconds.map((t: number): number => HumanSignature.apart(red, blue, t)),
  );
  TestValidator.predicate(
    `the wrestling pair has at most 10 mm joint intrusion (clearance ${clearance} m)`,
    clearance >= -0.01,
  );
  for (const actor of [red, blue]) {
    const height = (at: number): number =>
      HumanSignature.joint(actor, at, "head").y -
      HumanSignature.joint(actor, at, "hips").y;
    TestValidator.predicate(
      "the wrestler recovers their upright head-to-hip height",
      Math.abs(height(reset.duration) - height(0)) <= 0.01,
    );
  }
}
