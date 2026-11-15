import { createCart, createHandgun } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
  HumanWeaponFirearm,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An aim kept on a world target from a moving support (#3491): the line
 * planned at the start is re-taken at every second, the trunk twisting and
 * the arms turning and rising with it, and a twist out of the trunk's range
 * is refused.
 *
 * Scenarios, the average man standing 4 s on a cart, presenting a handgun
 * held in one hand at a world point 10 m ahead at chest height, over the
 * stance:
 * 1. With the cart running sideways at 1 m/s along +X, the presentation
 *    plans.
 * 2. Over its hold, at seven instants, the angle between the bore and the
 *    line from the muzzle to the target stays within the first instant's
 *    by the turn the audit's skin (`HumanVerdicts.SKIN`) at each end of the
 *    bore makes over its length from the sight to the muzzle, while the cart
 *    carries the shooter sideways across the line.
 * 3. With the cart instead turning in place at 90 degrees a second, the
 *    presentation is refused, a `HumanRefusal` on `target`: holding the aim
 *    would twist the trunk past its range.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Presents a real handgun over a stance on a moving cart through the public chain and reads the displayed gun against the world target; an aim carried off with the cart, or a twist past the range accepted, fails.
 * @evidence contracts/development/testing.md#independent-expectations The cart's motions and the target are the scene's; the twist's range is the engine's range-of-motion table; the bore's bound is the audit's skin at both ends of the gun's own bore.
 * @evidence contracts/development/testing.md#distinguishing-cases A carry across the line, held; a turn past the range, refused.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the three numbered scenarios with their bounds.
 */
export function test_human_motion_support_aim(): void {
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const gun: ReturnType<typeof createHandgun> = createHandgun({
    frame: "fullSize",
  });
  const body: IHumanBody = motionHumanBody("m-average");
  const target: IAutoMovieVector3 = {
    x: 0,
    y: body.measure.chestHeight,
    z: 10,
  };
  const perform = (
    motion: (seconds: number) => HumanObject.Placement,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "support-aim",
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
            target: { kind: "point", frame: "world", at: target },
            seconds: 2,
          }),
        ).node,
    });

  let performance: HumanPerformance;
  try {
    performance = perform(
      (seconds: number): HumanObject.Placement => ({
        at: { x: seconds, y: 0, z: 0 },
        yaw: 0,
      }),
    );
  } catch (error) {
    TestValidator.predicate(
      `the presentation plans on the sideways cart (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
    return;
  }
  const overlay = performance.overlays("a")[0];
  if (overlay === undefined) {
    TestValidator.predicate("the presentation is an overlay", false);
    return;
  }
  const muzzle = gun.affordance("muzzle").frame;
  const bound: number =
    (Math.atan(
      (2 * HumanVerdicts.SKIN) /
        Vector3.length(
          Vector3.subtract(
            muzzle.translation,
            gun.affordance("sight").frame.translation,
          ),
        ),
    ) *
      180) /
    Math.PI;
  const off = (t: number): number => {
    const held = performance.prop("gun", t);
    const point: IAutoMovieVector3 = Vector3.add(
      held.position,
      Quaternion.rotateVector(held.rotation, muzzle.translation),
    );
    const bore: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(held.rotation, muzzle.rotation),
      { x: 0, y: 1, z: 0 },
    );
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(target, point),
    );
    return (
      (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(bore, line)))) * 180) /
      Math.PI
    );
  };
  const from: number = overlay.start + overlay.plan.duration * 0.5;
  const to: number = overlay.start + overlay.plan.duration;
  const first: number = off(from);
  let worst: number = 0;
  for (let k: number = 1; k < 7; k++)
    worst = Math.max(worst, Math.abs(off(from + ((to - from) * k) / 6) - first));
  TestValidator.predicate(
    `the bore stays on the target across the carry (${worst.toFixed(3)} of ${bound.toFixed(3)} degrees)`,
    worst <= bound,
  );

  let refused: unknown = undefined;
  try {
    perform(
      (seconds: number): HumanObject.Placement => ({
        at: { x: 0, y: 0, z: 0 },
        yaw: 90 * seconds,
      }),
    );
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    `a turn past the trunk's range is refused on the target (${refused instanceof Error ? refused.message : "accepted"})`,
    refused instanceof HumanRefusal && refused.axis === "target",
  );
}
