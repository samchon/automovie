import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanObject } from "@automovie/interface";
import { createCart } from "@automovie/archetypes";
import { HumanChain, HumanObject, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Boarding a moving support (#3491): stepping from the ground onto a prop
 * that moves faster than the gait is refused with the speeds and the fix.
 *
 * Scenarios, the average man walking from the ground onto a cart:
 * 1. A cart at 6 m/s refuses the walk with a `base` refusal on `on` whose
 *    feasible range ends at the walk's own speed, below 6 m/s.
 * 2. A cart at 0.5 m/s, slower than a normal walk (about 1.35 m/s for the
 *    average man, `sqrt(Fr g l)` at Froude 0.2), is boarded.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Walks onto a fast and a slow cart through the public chain; a fast cart boarded or a slow one refused fails.
 * @evidence contracts/development/testing.md#independent-expectations The speeds are the scene's; the walk's speed is the Froude rule written here.
 * @evidence contracts/development/testing.md#distinguishing-cases A support faster and one slower than the gait.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the two numbered scenarios.
 */
export function test_human_motion_support_board_refusal(): void {
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const board = (speed: number): unknown => {
    try {
      const motion = (seconds: number): IAutoMovieMotionHumanObject.Placement => ({
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
  const fast: unknown = board(6);
  TestValidator.predicate(
    "a fast cart is refused on its speed",
    fast instanceof HumanRefusal &&
      fast.kind === "base" &&
      fast.axis === "on" &&
      fast.feasible?.kind === "range" &&
      (fast.feasible.maximum ?? Infinity) < 6,
  );
  TestValidator.predicate(
    "a slow cart is boarded",
    board(0.5) instanceof HumanPerformance,
  );
}
