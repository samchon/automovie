import { createHandgun } from "@automovie/archetypes";
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
 * A shot drives the trigger it presses (#3476): `fireFirearm` publishes the
 * handgun's `trigger` drive, full travel by the break and back by the end.
 *
 * Scenarios, the average man and the small woman, holding a full-size
 * handgun taken from a table, presenting it and firing once:
 * 1. The shot publishes one drive, of the gun's trigger articulation.
 * 2. At the shot's start the trigger is at rest (travel 0 within 1e-9).
 * 3. At the shot's decisive instant (the break) its travel equals the gun's
 *    declared trigger travel within 1e-9.
 * 4. At the shot's end it is back at rest within 1e-9.
 * 5. Between the start and the break the travel rises monotonically at ten
 *    instants.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fires a real handgun archetype through the public chain and reads the performance's state; a trigger never driven, one not at full pull at the break or one that stays pulled fails.
 * @evidence contracts/development/testing.md#independent-expectations The full travel is the archetype's own trigger affordance's `travel`; the break is the plan's decisive instant.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; the start, the rise, the break and the end.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the five numbered scenarios.
 */
export function test_human_motion_object_trigger_drive(): void {
  const gun: ReturnType<typeof createHandgun> = createHandgun({ frame: "fullSize" });
  const travel: number = gun.affordance("trigger").travel!;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "trigger",
        laws: [HumanWeaponFirearm.present, HumanWeaponFirearm.fire],
        props: [
          HumanObject.prop("gun", gun, { at: { x: 0.25, y: 0.9, z: 0.4 }, yaw: 0 }),
        ],
        performers: [
          { subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } },
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "gun", handle: "grip" })
          .registered("presentFirearm", { gun: "gun", hands: 1 })
          .registered("fireFirearm", { gun: "gun", hands: 1 }).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the shot plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const shot = performance.segments("a").at(-1)!;
    const drives = shot.plan.drives ?? [];
    TestValidator.predicate(
      `${name}: the shot drives the gun's trigger`,
      drives.length === 1 && drives[0]!.prop === "gun" && drives[0]!.articulation === "trigger",
    );
    const at = (t: number): number => performance.state("gun", t).trigger ?? 0;
    const start: number = shot.start;
    const brk: number = shot.start + (shot.plan.contact ?? 0);
    const end: number = shot.start + shot.plan.duration;
    TestValidator.predicate(`${name}: at rest at the start`, Math.abs(at(start)) <= 1e-9);
    TestValidator.predicate(
      `${name}: full travel at the break (${at(brk)} of ${travel})`,
      Math.abs(at(brk) - travel) <= 1e-9,
    );
    TestValidator.predicate(`${name}: back at rest at the end`, Math.abs(at(end)) <= 1e-9);
    let rising: boolean = true;
    for (let k: number = 1; k <= 10; k++)
      rising &&= at(start + ((brk - start) * k) / 10) >= at(start + ((brk - start) * (k - 1)) / 10);
    TestValidator.predicate(`${name}: the press rises monotonically`, rising);
  }
}
