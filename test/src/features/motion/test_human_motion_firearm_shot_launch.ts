import { createHandgun, createProjectile } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanVerdicts,
  HumanWeaponFirearm,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A shot launches its ball (#3488): from the muzzle, along the bore within
 * the declared dispersion, at the stated muzzle speed, at the break plus the
 * lock's time.
 *
 * Scenarios, the average man holding a handgun taken from a table, firing
 * once with a ball given as the shot at 350 m/s, once with no lock time and
 * once with a lock time of 5 ms:
 * 1. The shot publishes one launch of the ball.
 * 2. Its second is the break (the decisive instant) plus the lock's time,
 *    to float resolution, for both lock times.
 * 3. Its speed is the stated 350 m/s to float resolution (the shooter stands
 *    still).
 * 4. Its direction lies within `DISPERSION` degrees of the bore as the hand
 *    holds the gun at the break.
 * 5. The ball flies: it has one flight.
 * 6. A shot with no `shot` launches nothing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fires a real handgun and a real ball archetype through the public chain and reads the launch and the flight; a launch at the wrong instant, speed or direction, or a shot that launches nothing, fails.
 * @evidence contracts/development/testing.md#independent-expectations The speed and lock time are the scene's; the cone is the law's declared dispersion; the bore is the displayed muzzle's own +Y, its place the displayed muzzle within the audit's skin; the speed's bound is float resolution.
 * @evidence contracts/development/testing.md#distinguishing-cases No lock time and a lock time; a shot with and without a ball.
 * @evidence contracts/development/testing.md#execution-ownership Builds three performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the six numbered scenarios.
 */
export function test_human_motion_firearm_shot_launch(): void {
  const gun: ReturnType<typeof createHandgun> = createHandgun({
    frame: "fullSize",
  });
  const ball: ReturnType<typeof createProjectile> = createProjectile({
    kind: "ball",
  });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const perform = (
    shot: object | undefined,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "shot",
      laws: [HumanWeaponFirearm.present, HumanWeaponFirearm.fire],
      props: [
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
        .registered("presentFirearm", { gun: "gun", hands: 1 })
        .registered("fireFirearm", {
          gun: "gun",
          hands: 1,
          ...(shot === undefined ? {} : { shot }),
        }).node,
    });
  for (const lock of [0, 0.005]) {
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = perform({ prop: "ball", speed: 350, lock });
    } catch (error) {
      TestValidator.predicate(
        `the shot plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const shot = performance.segments("a").at(-1)!;
    const launches = shot.plan.launches ?? [];
    TestValidator.predicate(
      "one launch of the ball",
      launches.length === 1 && launches[0]!.prop === "ball",
    );
    const launch = launches[0];
    if (launch === undefined) continue;
    TestValidator.predicate(
      `it leaves at the break plus ${lock} s`,
      Math.abs(launch.seconds - ((shot.plan.contact ?? NaN) + lock)) <=
        Number.EPSILON * launch.seconds * 2 ** Math.ceil(Math.log2(8)),
    );
    TestValidator.predicate(
      `it leaves at 350 m/s (${Vector3.length(launch.velocity).toFixed(6)})`,
      // A unit direction scaled by the speed: a few roundings of it.
      Math.abs(Vector3.length(launch.velocity) - 350) <=
        Number.EPSILON * 350 * 2 ** Math.ceil(Math.log2(8)),
    );
    const brk: number = shot.start + (shot.plan.contact ?? 0);
    const held = performance.prop("gun", brk);
    const muzzle: IAutoMovieVector3 = Vector3.add(
      held.position,
      Quaternion.rotateVector(
        held.rotation,
        gun.affordance("muzzle").frame.translation,
      ),
    );
    TestValidator.predicate(
      `${Math.round(lock * 1000)} ms lock: it leaves the displayed muzzle (${(1000 * Vector3.length(Vector3.subtract(launch.point, muzzle))).toFixed(1)} mm)`,
      Vector3.length(Vector3.subtract(launch.point, muzzle)) <=
        HumanVerdicts.SKIN,
    );
    // The bore runs along the muzzle's own +Y, as the archetype declares it.
    const bore: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(
        held.rotation,
        gun.affordance("muzzle").frame.rotation,
      ),
      { x: 0, y: 1, z: 0 },
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
      `it leaves along the bore within the dispersion (${off.toFixed(3)} degrees)`,
      off <=
        HumanWeaponFirearm.DISPERSION +
          (Number.EPSILON * 2 ** Math.ceil(Math.log2(8)) * 180) / Math.PI,
    );
    TestValidator.predicate(
      "the ball flies",
      performance.flights("ball").length === 1,
    );
  }
  let quiet: IAutoMovieMotionHumanPerformance | undefined;
  try {
    quiet = perform(undefined);
  } catch {
    quiet = undefined;
  }
  TestValidator.predicate(
    "a shot without a ball launches nothing",
    quiet !== undefined &&
      (quiet.segments("a").at(-1)!.plan.launches ?? []).length === 0,
  );
}
