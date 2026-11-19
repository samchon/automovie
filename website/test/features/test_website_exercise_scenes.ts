import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

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
}
