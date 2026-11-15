import {
  createCart,
  createHandgun,
  createProjectile,
} from "@automovie/archetypes";
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
 * A shot from a moving support (#3491, #3488): the shot planned at the
 * fire's start is carried with the weapon to its second, so the ball leaves
 * the displayed muzzle along the displayed bore.
 *
 * Scenarios, the average man standing 4 s on a cart that turns in place at
 * 20 degrees a second, presenting a handgun held in one hand at the ready
 * and firing a ball at 350 m/s over the stance:
 * 1. The presentation and the shot plan over the stance.
 * 2. The ball's launch point is the displayed muzzle at the launch second,
 *    within 1 cm (provisional: the arm fit's residual against its goal).
 * 3. The launch's direction lies within `DISPERSION` degrees of the
 *    displayed bore at that second, plus 1 degree (provisional, the same
 *    residual), although the cart has turned since the fire began.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fires a real handgun and ball over a stance on a turning cart through the public chain and reads the launch against the displayed gun; a shot launched from where the gun was at the fire's start fails.
 * @evidence contracts/development/testing.md#independent-expectations The cart's turn and the shot are the scene's; the cone is the law's declared dispersion; the 1 cm and 1 degree are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases The launch's point and its direction.
 * @evidence contracts/development/testing.md#execution-ownership Builds one performance in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the three numbered scenarios with their bounds.
 */
export function test_human_motion_support_shot(): void {
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const gun: ReturnType<typeof createHandgun> = createHandgun({
    frame: "fullSize",
  });
  const ball: ReturnType<typeof createProjectile> = createProjectile({
    kind: "ball",
  });
  const motion = (seconds: number): HumanObject.Placement => ({
    at: { x: 0, y: 0, z: 0 },
    yaw: 20 * seconds,
  });
  const body: IHumanBody = motionHumanBody("m-average");
  let performance: HumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "support-shot",
      laws: [HumanWeaponFirearm.present, HumanWeaponFirearm.fire],
      props: [
        HumanObject.prop("cart", cart, motion(0), motion),
        HumanObject.prop("gun", gun, {
          at: { x: 0.25, y: 0.9, z: 0.4 },
          yaw: 0,
        }),
        HumanObject.prop("ball", ball, { at: { x: 5, y: 0, z: 5 }, yaw: 0 }),
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
          u
            .registered("presentFirearm", {
              gun: "gun",
              hands: 1,
              carriage: "lowReady",
            })
            .registered("fireFirearm", {
              gun: "gun",
              hands: 1,
              shot: { prop: "ball", speed: 350 },
            }),
        ).node,
    });
  } catch (error) {
    TestValidator.predicate(
      `the shot plans over the stance (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
    return;
  }
  const fire = performance
    .overlays("a")
    .find((o) => (o.plan.launches ?? []).length !== 0);
  const launch = fire?.plan.launches?.[0];
  if (fire === undefined || launch === undefined) {
    TestValidator.predicate("the shot launches its ball", false);
    return;
  }
  const t: number = fire.start + launch.seconds;
  const held = performance.prop("gun", t);
  const along = (id: "muzzle" | "sight"): IAutoMovieVector3 =>
    Vector3.add(
      held.position,
      Quaternion.rotateVector(held.rotation, gun.affordance(id).frame.translation),
    );
  const miss: number = Vector3.length(
    Vector3.subtract(launch.point, along("muzzle")),
  );
  TestValidator.predicate(
    `the ball leaves the displayed muzzle (${(1000 * miss).toFixed(1)} mm)`,
    miss <= 0.01,
  );
  const bore: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(along("muzzle"), along("sight")),
  );
  const off: number =
    (Math.acos(
      Math.max(
        -1,
        Math.min(1, Vector3.dot(bore, Vector3.normalize(launch.velocity))),
      ),
    ) *
      180) /
    Math.PI;
  TestValidator.predicate(
    `it leaves along the displayed bore (${off.toFixed(3)} degrees)`,
    off <= HumanWeaponFirearm.DISPERSION + 1,
  );
}
