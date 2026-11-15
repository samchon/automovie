import { createCart, createHandgun } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanWeaponFirearm,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Presenting over a moving support (#3491): a person standing on a moving
 * cart presents a handgun as an overlay of the stance, claiming the trunk's
 * turn and the holding arm, and the plan made at its start is carried by
 * the cart.
 *
 * Scenarios, the average man standing 4 s on a cart running at 1 m/s along
 * +Z, presenting a handgun held in one hand at a point 3 m ahead of where he
 * stands at the start, at chest height, over the stance (the first pass
 * carries the aim with the cart; re-aiming at each second is phase 2's):
 * 1. The presentation plans as an overlay and claims `trunkTurn` and the
 *    right arm and hand.
 * 2. Over its hold, at seven instants, the muzzle's place in the cart's
 *    frame moves by at most 10 mm (#3491's bound for what rides a support).
 * 3. The feet stay planted on the cart: the toes move by at most 10 mm in
 *    its frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Presents a real handgun over a stance on a moving cart through the public chain and reads the displayed gun and feet in the cart's frame; a presentation left behind in the world, a refused overlay or feet dragged off the bed fails.
 * @evidence contracts/development/testing.md#independent-expectations The cart's motion is the scene's; the 10 mm is #3491's bound.
 * @evidence contracts/development/testing.md#distinguishing-cases The gun and the feet; seven instants of the hold.
 * @evidence contracts/development/testing.md#execution-ownership Builds one performance in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the three numbered scenarios with their bounds.
 */
export function test_human_motion_carrier_present_cart(): void {
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const gun: ReturnType<typeof createHandgun> = createHandgun({
    frame: "fullSize",
  });
  const motion = (seconds: number): HumanObject.Placement => ({
    at: { x: 0, y: 0, z: seconds },
    yaw: 0,
  });
  const body: IHumanBody = motionHumanBody("m-average");
  let performance: HumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "carrier-present",
      laws: [HumanWeaponFirearm.present],
      props: [
        HumanObject.prop("cart", cart, motion(0), motion),
        HumanObject.prop("gun", gun, {
          at: { x: 0.25, y: 0.9, z: 0.4 },
          yaw: 0,
        }),
      ],
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
        .pickUp({ prop: "gun", handle: "grip" })
        .stand({ seconds: 4, on: { prop: "cart" } })
        .over((u) =>
          u.registered("presentFirearm", {
            gun: "gun",
            hands: 1,
            target: {
              kind: "point",
              frame: "world",
              at: { x: 0, y: body.measure.chestHeight, z: 3 },
            },
            seconds: 2,
          }),
        ).node,
    });
  } catch (error) {
    TestValidator.predicate(
      `the presentation plans over the stance (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
    return;
  }
  const overlay = performance.overlays("a")[0];
  TestValidator.predicate(
    "the presentation is an overlay claiming the trunk's turn and the right arm",
    overlay !== undefined &&
      (overlay.plan.channels ?? []).includes("trunkTurn") &&
      (overlay.plan.channels ?? []).includes("rightArm"),
  );
  if (overlay === undefined) return;
  const local = (p: IAutoMovieVector3, t: number): IAutoMovieVector3 => {
    const at = HumanObject.frame(motion(t));
    return Quaternion.rotateVector(
      Quaternion.inverse(at.rotation),
      Vector3.subtract(p, at.position),
    );
  };
  const muzzle = (t: number): IAutoMovieVector3 => {
    const held = performance.prop("gun", t);
    return local(
      Vector3.add(
        held.position,
        Quaternion.rotateVector(
          held.rotation,
          gun.affordance("muzzle").frame.translation,
        ),
      ),
      t,
    );
  };
  const from: number = overlay.start + overlay.plan.duration * 0.5;
  const to: number = overlay.start + overlay.plan.duration;
  const first: IAutoMovieVector3 = muzzle(from);
  let drift: number = 0;
  for (let k: number = 1; k < 7; k++)
    drift = Math.max(
      drift,
      Vector3.length(
        Vector3.subtract(muzzle(from + ((to - from) * k) / 6), first),
      ),
    );
  TestValidator.predicate(
    `the presented muzzle rides the cart (${(1000 * drift).toFixed(1)} mm)`,
    drift <= 0.01,
  );
  for (const side of ["left", "right"] as const) {
    const toe = (t: number): IAutoMovieVector3 =>
      local(performance.bones("a", t).get(`${side}Toes`)!.worldPosition, t);
    const start: IAutoMovieVector3 = toe(from);
    let slip: number = 0;
    for (let k: number = 1; k < 7; k++)
      slip = Math.max(
        slip,
        Vector3.length(
          Vector3.subtract(toe(from + ((to - from) * k) / 6), start),
        ),
      );
    TestValidator.predicate(
      `the ${side} foot stays on the cart (${(1000 * slip).toFixed(1)} mm)`,
      slip <= 0.01,
    );
  }
}
