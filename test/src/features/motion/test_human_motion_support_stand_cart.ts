import { createCart } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSupportFrame,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A standing base on a moving support (#3491): a person standing on a cart
 * moving at 2 m/s through a turn keeps their feet where they stood in the
 * cart's frame, and the support reader reads the cart's own motion.
 *
 * Scenarios, the average man and the small woman, standing 4 s on a cart
 * placed under them that runs at 2 m/s along +Z and turns 10 degrees a
 * second about the vertical:
 * 1. The stance plans, its feet planted on the cart (`prop` support).
 * 2. At seven instants each foot's toe joint is within 10 mm of where it
 *    stood in the cart's frame at the start (#3491's bound).
 * 3. The stance's heading turns with the cart: at the end it has turned
 *    40 degrees within 1 degree.
 * 4. `HumanSupportFrame.at` of a context on the cart reads the cart's
 *    velocity, 2 m/s within 1e-3 m/s, at the start (the turn's own
 *    contribution at the origin is nil).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Stands a body on a moving cart archetype through the public chain and reads the displayed feet in the cart's frame and the support reader; feet left on the ground, sliding on the bed or a heading that does not turn fails.
 * @evidence contracts/development/testing.md#independent-expectations The cart's motion is the scene's own function; the 10 mm is #3491's bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; a translation and a turn together.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory and reads seven instants of each.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios with their bounds.
 */
export function test_human_motion_support_stand_cart(): void {
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const motion = (seconds: number): HumanObject.Placement => ({
    at: { x: 0, y: 0, z: 2 * seconds },
    yaw: 10 * seconds,
  });
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "cart",
        props: [HumanObject.prop("cart", cart, motion(0), motion)],
        performers: [
          { subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } },
        ],
        composition: HumanChain.subject("a").stand({ seconds: 4, on: { prop: "cart" } }).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the stance plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const segment = performance.segments("a")[0]!;
    TestValidator.predicate(
      `${name}: the feet are planted on the cart`,
      segment.plan.contacts.every((c) => c.support.kind === "prop"),
    );
    const local = (side: "left" | "right", t: number): IAutoMovieVector3 => {
      const ball: IAutoMovieVector3 = performance
        .bones("a", t)
        .get(`${side}Toes`)!.worldPosition;
      const at = HumanObject.frame(motion(t));
      return Quaternion.rotateVector(
        Quaternion.inverse(at.rotation),
        Vector3.subtract(ball, at.position),
      );
    };
    for (const side of ["left", "right"] as const) {
      const start: IAutoMovieVector3 = local(side, 0.6);
      let worst: number = 0;
      for (let k: number = 0; k < 7; k++) {
        const t: number = 0.6 + (k * 3.3) / 6;
        worst = Math.max(worst, Vector3.length(Vector3.subtract(local(side, t), start)));
      }
      TestValidator.predicate(
        `${name}: the ${side} foot stays on its place on the cart (${(1000 * worst).toFixed(1)} mm)`,
        worst <= 0.01,
      );
    }
    const turned: number = performance.posture("a", 4).yaw - performance.posture("a", 0).yaw;
    TestValidator.predicate(
      `${name}: the heading turns with the cart (${turned.toFixed(2)} degrees)`,
      Math.abs(turned - 40) <= 1,
    );
  }

  // 4. The support reader.
  const frame = HumanSupportFrame.at(
    {
      entry: {
        supports: [{ part: "leftFoot", kind: "plant", support: { kind: "prop", subject: "cart" } }],
      } as never,
      prop: () => ({
        prop: HumanObject.prop("cart", cart, motion(0), motion),
        frame: (t: number) => HumanObject.frame(motion(t)),
      }),
      performer: () => {
        throw new Error("no performer");
      },
    },
    0,
  );
  TestValidator.predicate(
    `the support reader reads the cart's speed (${Vector3.length(frame.velocity).toFixed(4)} m/s)`,
    Math.abs(Vector3.length(frame.velocity) - 2) <= 1e-3,
  );
}
