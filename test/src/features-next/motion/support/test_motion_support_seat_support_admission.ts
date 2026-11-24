import { createCart } from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanObject,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSupport,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * Boarding a moving support (#3491): stepping from the ground onto a prop
 * that moves faster than the gait is refused with the speeds and the fix.
 *
 * Scenarios:
 * 1. A cart just above the speed from Froude 0.2 refuses with a `base` refusal on `on` whose
 *    feasible range ends at that independently computed speed.
 * 2. A cart just below the same normal walk speed (about 1.35 m/s for the
 *    average man, `sqrt(Fr g l)` at Froude 0.2), is boarded.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the boarding decision against independently moving prop frames; a fast cart boarded or a slow one refused fails.
 * @evidence contracts/development/testing.md#independent-expectations The speeds are the scene's; the walk's speed is the Froude rule written here.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks speeds immediately below, at and above the gait.
 * @evidence contracts/development/testing.md#execution-ownership Calls the public boarding guard on one standing entry and three analytic prop velocities.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the two numbered scenarios.
 */
export function test_motion_support_seat_support_admission(): void {
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const limit: number = Math.sqrt(
    0.2 * AutoMovieGravity.STANDARD * body.measure.hipHeight,
  );
  const epsilon: number = limit * Math.sqrt(Number.EPSILON);
  const moving = (name: string, speed: number) => {
    const motion = (t: number): IAutoMovieMotionHumanObject.Placement => ({
      at: { x: speed * t, y: 0, z: 0 },
      yaw: 0,
    });
    return HumanObject.prop(name, cart, motion(0), motion);
  };
  const standing = new HumanPerformance({
    seed: "support-frame",
    props: [
      moving("slow", limit - epsilon),
      moving("limit", limit),
      moving("fast", limit + epsilon),
    ],
    performers: [
      {
        subject: "a",
        body,
        proficiency: { level: "trained" },
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 1 }).node,
  });
  const context = standing.segments("a")[0]!.context;
  AutoMovieMotionHumanSupport.frame.board(context, "slow", limit);
  AutoMovieMotionHumanSupport.frame.board(context, "limit", limit);
  let refusal: unknown;
  try {
    AutoMovieMotionHumanSupport.frame.board(context, "fast", limit);
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "a support above gait speed reports the measured speed and feasible range",
    refusal instanceof HumanRefusal &&
      refusal.kind === "base" &&
      refusal.axis === "on" &&
      refusal.feasible?.kind === "range" &&
      refusal.feasible.minimum === 0 &&
      refusal.feasible.unit === "m/s" &&
      nclose(refusal.feasible.maximum ?? NaN, limit, Number.EPSILON * limit) &&
      typeof refusal.value === "number" &&
      nclose(refusal.value, limit + epsilon, epsilon / 2),
  );
}
