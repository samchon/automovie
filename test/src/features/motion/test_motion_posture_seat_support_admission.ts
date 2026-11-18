import { createCart } from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanObject,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

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
 * @evidence contracts/development/testing.md#behavioral-verification Walks onto a fast and a slow cart through the public chain; a fast cart boarded or a slow one refused fails.
 * @evidence contracts/development/testing.md#independent-expectations The speeds are the scene's; the walk's speed is the Froude rule written here.
 * @evidence contracts/development/testing.md#distinguishing-cases A support faster and one slower than the gait.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the two numbered scenarios.
 */
export function test_motion_posture_seat_support_admission(): void {
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const board = (speed: number): unknown => {
    try {
      const motion = (
        seconds: number,
      ): IAutoMovieMotionHumanObject.Placement => ({
        at: { x: 0, y: 0, z: 1 + speed * seconds },
        yaw: 0,
      });
      return new HumanPerformance({
        seed: "board",
        props: [HumanObject.prop("cart", cart, motion(0), motion)],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").walk({
          to: { x: 0, y: 0, z: 3 },
          on: { prop: "cart" },
        }).node,
      });
    } catch (error) {
      return error;
    }
  };
  // Fr = v²/(gL), with L the standing hip height. Relative sqrt(epsilon)
  // separates the two speeds above roundoff in the cart velocity difference.
  const speed: number = Math.sqrt(
    0.2 * AutoMovieGravity.STANDARD * body.measure.hipHeight,
  );
  const delta: number = speed * Math.sqrt(Number.EPSILON);
  const fast: unknown = board(speed + delta);
  TestValidator.predicate(
    "a fast cart is refused on its speed",
    fast instanceof HumanRefusal &&
      fast.kind === "base" &&
      fast.axis === "on" &&
      fast.feasible?.kind === "range" &&
      fast.feasible.minimum === 0 &&
      fast.feasible.unit === "m/s" &&
      nclose(fast.feasible.maximum ?? NaN, speed, Number.EPSILON * speed) &&
      typeof fast.value === "number" &&
      nclose(fast.value, speed + delta, delta / 2),
  );
  TestValidator.predicate(
    "a slow cart is boarded",
    board(speed - delta) instanceof HumanPerformance,
  );
}
