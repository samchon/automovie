import assert from "node:assert/strict";

import { evaluateFootContacts } from "../../../src/actors/evaluateFootContacts";

/**
 * Keep actual support roles separate from preferred airborne foot positions.
 *
 * @evidence contracts/testing.md#observable-behavior Uses representative opening, entry, turning and backward-retreat phases of the actual contact planner. Asserts one foot remains supported during every sampled timeline frame, flat holds, changing swing sides and explicit toe/heel rolling. It would reject the former policy of making every lifted skin point a hard supporting contact.
 * @evidence contracts/testing.md#independent-cases Literal stationary/alternating/rolling responsibilities supply expectations independently of solver outputs. Both actors and all0–60s24fps planning frames are covered, but fitted sole admission, air clearance and visible gait remain the actual whole-scene checks.
 */
export function test_foot_contact_modes(): void {
  assert.deepEqual(evaluateFootContacts("carina", 3), { left: "flat", right: "flat" });
  assert.equal(evaluateFootContacts("carina", 0.2).left, "air");
  assert.equal(evaluateFootContacts("carina", 0.6).right, "toe");
  assert.equal(evaluateFootContacts("carina", 1.0).right, "air");
  assert.equal(evaluateFootContacts("carina", 4.25).left, "toe");
  assert.equal(evaluateFootContacts("harry", 46.8).right, "heel");
  assert.deepEqual(evaluateFootContacts("harry", 46.96), { left: "toe", right: "air" });
  for (const person of ["carina", "harry"] as const) for (let frame: number = 0; frame <= 1440; frame++) {
    const mode: ReturnType<typeof evaluateFootContacts> = evaluateFootContacts(person, frame / 24);
    assert.ok(mode.left !== "air" || mode.right !== "air");
  }
}
