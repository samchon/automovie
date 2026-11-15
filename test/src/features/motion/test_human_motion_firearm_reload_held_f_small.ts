import { TestValidator } from "@nestia/e2e";

import { motionHumanReloadHeld } from "../internal/motionHumanReloadHeld";

/**
 * A reload presses the magazine of the gun the other hand holds, on
 * the small woman: the production's range-counter scene (a compact pistol taken up
 * from a counter, its magazine pressed, the pistol laid back) plans, or is
 * refused by a `HumanRefusal` naming its reason, where reading the carried
 * gun at the second the press was solved overran the stack.
 *
 * Scenarios (`motionHumanReloadHeld` states the scene):
 * 1. The scene builds: it plans, or is refused by a `HumanRefusal`; a stack
 *    overflow or any other error fails with its name and message.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the production's scene through the public chain and reads what the build throws; an unbounded read of the carried gun fails with its message.
 * @evidence contracts/development/testing.md#independent-expectations That a scene plans or is refused, and never throws otherwise, is the grammar's contract for any scene.
 * @evidence contracts/development/testing.md#distinguishing-cases One body; the other build is its own spec.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one performance in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the scene, the failure it guards and the scenario.
 */
export function test_human_motion_firearm_reload_held_f_small(): void {
  TestValidator.equals(
    "a reload presses the magazine of the gun the other hand holds",
    motionHumanReloadHeld.read("f-small"),
    [],
  );
}
