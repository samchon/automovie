import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanObject, IAutoMovieMotionHumanPerformance, IAutoMovieVector3 } from "@automovie/interface";
import { createCart } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";

import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Walking on a moving support (#3491): a walk along a wagon's bed, planned
 * where the bed stood at its start and carried by the bed's motion, lays
 * its feet where the same walk on a still floor would, in the bed's frame.
 *
 * Scenarios, the average man standing 0.5 s on a cart that runs at 2 m/s
 * along +Z, then walking 3 m along it, and the same with the cart still:
 * 1. Both walks plan, the moving one's plants on the cart.
 * 2. At seven instants each toe joint's place in the cart's frame is within
 *    10 mm of the still walk's at the same instant (#3491's bound).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Walks a body along a moving cart archetype and a still one through the public chain and compares the feet in the cart's frame; a walk left on the ground, sliding on the bed or stepping elsewhere fails.
 * @evidence contracts/development/testing.md#independent-expectations The still walk is the reference; the 10 mm is #3491's bound.
 * @evidence contracts/development/testing.md#distinguishing-cases A moving and a still support; both feet.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the two numbered scenarios with their bound.
 */
export function test_human_motion_support_walk_wagon(): void {
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const perform = (speed: number): IAutoMovieMotionHumanPerformance => {
    const motion = (seconds: number): IAutoMovieMotionHumanObject.Placement => ({
      at: { x: 0, y: 0, z: speed * seconds },
      yaw: 0,
    });
    return new HumanPerformance({
      seed: "wagon",
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
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.5, on: { prop: "cart" } })
        .walk({ to: { x: 0, y: 0, z: 3 + speed * 0.5 }, on: { prop: "cart" } })
        .node,
    });
  };
  let moving: IAutoMovieMotionHumanPerformance;
  let still: IAutoMovieMotionHumanPerformance;
  try {
    moving = perform(2);
    still = perform(0);
  } catch (error) {
    TestValidator.predicate(
      `the walks plan (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
    return;
  }
  TestValidator.predicate(
    "the moving walk plants on the cart",
    moving
      .segments("a")[1]!
      .plan.contacts.filter((c) => c.kind === "plant")
      .every((c) => c.support.kind === "prop"),
  );
  const local = (
    p: IAutoMovieMotionHumanPerformance,
    speed: number,
    side: "left" | "right",
    t: number,
  ): IAutoMovieVector3 => {
    const at = HumanObject.frame({ at: { x: 0, y: 0, z: speed * t }, yaw: 0 });
    return Quaternion.rotateVector(
      Quaternion.inverse(at.rotation),
      Vector3.subtract(
        p.bones("a", t).get(`${side}Toes`)!.worldPosition,
        at.position,
      ),
    );
  };
  const duration: number = Math.min(moving.duration, still.duration);
  for (const side of ["left", "right"] as const) {
    let worst: number = 0;
    for (let k: number = 0; k < 7; k++) {
      const t: number = (duration * (k + 0.5)) / 7;
      worst = Math.max(
        worst,
        Vector3.length(
          Vector3.subtract(local(moving, 2, side, t), local(still, 0, side, t)),
        ),
      );
    }
    TestValidator.predicate(
      `the ${side} foot steps on the bed as on a still floor (${(1000 * worst).toFixed(1)} mm)`,
      worst <= 0.01,
    );
  }
}
