import assert from "node:assert/strict";
import { AutoMovieHumanRigControls } from "@automovie/human";
import * as THREE from "three";

import { createDuelCapMotion } from "../../../src/createDuelCapMotion";
import { createDuelCourt } from "../../../src/createDuelCourt";
import { duelEvents } from "../../../src/duelEvents";
import { evaluateDuelEnding } from "../../../src/evaluateDuelEnding";
import { evaluateDuelRescue } from "../../../src/evaluateDuelRescue";
import type { DuelRescueEntry } from "../../../src/DuelRescueEntry";

/**
 * @evidence contracts/testing.md#observable-behavior Synthetic accepted entries protect rescue contact order, two side-step beats, actual first-footprint inheritance, escape-before-web-break and continued forearm grip through recovery. Ending goals release before the backstep, carry the brief still arm, show exact English lines and defer black until59.75. These are planned action/timing tests; uninvoked modules gain no Human or moving-scene admission here.
 * @evidence contracts/testing.md#independent-cases Asymmetric entries protect per-halfstep approach landings rather than premature pair-end strides, and the across-front transfer reaches the shared contact formation. Separate blocked escape/protection/recovery cases keep downstream magic and posture recovery dependent on actual scene events. The real cap supplies ordering; public neck bounds, deterministic reordered calls, input immutability and future ending foot/release goals are also checked. Pure goals establish neither assembled Human support nor contact.
 */
export function test_duel_rescue_goals(): void {
  const reference: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(0.2, -0.01, 0.1), right: new THREE.Vector3(0.2, -0.01, -0.1) };
  const entries: Record<"Carina" | "Harry", DuelRescueEntry> = {} as Record<"Carina" | "Harry", DuelRescueEntry>;
  for (const role of ["Carina", "Harry"] as const) {
    const position: THREE.Vector3 = role === "Carina" ? new THREE.Vector3(-0.2, 0.01, -0.1) : new THREE.Vector3(1.3, 0.01, -1.3);
    const yaw: number = role === "Carina" ? 0.65 : Math.PI;
    const foot: (side: "left" | "right") => THREE.Vector3 = (side: "left" | "right"): THREE.Vector3 => {
      const point: THREE.Vector3 = reference[side].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(position);
      point.y = 0;
      return point;
    };
    entries[role] = { position, yaw, left: foot("left"), right: foot("right"), wrist: position.clone().add(new THREE.Vector3(0.2, 1.2, 0.05)), wandTip: position.clone().add(new THREE.Vector3(0.5, 1.2, 0.05)), pose: { legs: { left: { knee: { flexion: 5 } }, right: { knee: { flexion: 5 } } } } };
  }
  const meeting: Record<"Carina" | "Harry", THREE.Vector3> = { Carina: new THREE.Vector3(1.02, 0, -1.4), Harry: new THREE.Vector3(1.3, 0, -1.3) };
  const rescue: (time: number, role: "Carina" | "Harry") => ReturnType<typeof evaluateDuelRescue> = (time: number, role: "Carina" | "Harry"): ReturnType<typeof evaluateDuelRescue> => evaluateDuelRescue(time, role, entries, reference, meeting);
  for (const role of ["Carina", "Harry"] as const) {
    assert.deepEqual(rescue(25, role).left, entries[role].left);
    assert.deepEqual(rescue(25, role).right, entries[role].right);
    for (const beat of [39.1, 40]) {
      assert.ok(Math.abs(rescue(beat, role).left.y) < 1e-10);
      assert.ok(Math.abs(rescue(beat, role).right.y) < 1e-10);
    }
    const frozen: ReturnType<typeof rescue> = rescue(41, role);
    rescue(28, role);
    assert.deepEqual(rescue(41, role), frozen);
    const blocked: ReturnType<typeof evaluateDuelRescue> = evaluateDuelRescue(40, role, entries, reference, meeting, false);
    assert.equal(blocked.position.x, meeting[role].x, "A missing actual protective contact event cannot trigger westward body motion");
    assert.deepEqual(blocked.left, rescue(38.2, role).left);
    assert.deepEqual(blocked.right, rescue(38.2, role).right);
  }
  assert.ok(rescue(35.5, "Harry").reach > 0 && rescue(35.5, "Harry").forearmGrip === 0);
  assert.equal(rescue(38, "Harry").forearmGrip, 1);
  assert.equal(rescue(38, "Carina").shoulder, 1);
  assert.equal(rescue(46.5, "Carina").shoulder, 0);
  assert.equal(rescue(48, "Harry").forearmGrip, 1);
  for (let step: number = 1; step <= 4; step++) {
    const at: number = 30.5 + step * 4.3 / 6;
    const plan: ReturnType<typeof rescue> = rescue(at, "Carina");
    const side: "left" | "right" = step % 2 === 1 ? "left" : "right";
    const expected: THREE.Vector3 = reference[side].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), plan.yaw).add(plan.position);
    expected.y = 0;
    assert.ok(plan[side].distanceTo(expected) < 1e-10, "A halfstep lands at its current body plan, not the future pair endpoint");
  }
  assert.ok(rescue(35.5, "Carina").position.distanceTo(meeting.Carina) > 0.1);
  assert.ok(rescue(36.4, "Carina").left.y > 0, "The across-front approach owns an actual foot transfer");
  assert.ok(rescue(37.7, "Carina").position.distanceTo(meeting.Carina) < 1e-10);
  const protectedBlock: ReturnType<typeof evaluateDuelRescue> = evaluateDuelRescue(46.5, "Carina", entries, reference, meeting, false, false, false);
  assert.equal(protectedBlock.shield, 0, "Uncleared bodies cannot start the shield");
  assert.equal(protectedBlock.shoulder, 1, "Unadmitted debris outcome cannot trigger shoulder recovery");
  assert.equal(protectedBlock.pose.legs!.left.knee!.flexion, 10);
  assert.equal(evaluateDuelRescue(46.5, "Carina", entries, reference, meeting, true, true, false).shield, 1, "The shield stays until the actual debris outcome enables recovery");
  const first: ReturnType<typeof rescue> = rescue(39.1, "Harry");
  assert.ok(Math.max(first.left.x, first.right.x) + 0.3 < 1.2, "Fixture's complete0.30m rearward shoe offsets leave the fall strip in the first beat");
  assert.ok(rescue(40, "Harry").position.x + 0.3 < 1, "Second beat clears the fixture body/wand envelope");
  const court: ReturnType<typeof createDuelCourt> = createDuelCourt();
  try {
    const cap: ReturnType<typeof createDuelCapMotion> = createDuelCapMotion(court.cap, duelEvents.capRelease, court.bearing);
    assert.ok(duelEvents.escapePlanted < duelEvents.shieldRaised && duelEvents.shieldRaised < cap.webBreakSeconds && cap.webBreakSeconds < duelEvents.capRelease);
  } finally { court.dispose(); }
  assert.equal(evaluateDuelEnding(52, "Harry", entries, reference).forearmGrip, 1);
  assert.equal(evaluateDuelEnding(52.7, "Harry", entries, reference).forearmGrip, 0);
  assert.deepEqual(evaluateDuelEnding(53, "Carina", entries, reference).left, entries.Carina.left);
  assert.equal(evaluateDuelEnding(50, "Harry", entries, reference).line, "Did you just save me?");
  assert.equal(evaluateDuelEnding(56, "Carina", entries, reference).line, "Look at me this time.");
  assert.equal(evaluateDuelEnding(59.7, "Harry", entries, reference).black, false);
  assert.equal(evaluateDuelEnding(59.75, "Harry", entries, reference).black, true);
  const axial: { minimum: number; maximum: number } = AutoMovieHumanRigControls.bounds("neck.atlantoAxial.rotation");
  for (let frame: number = 600; frame <= 1440; frame++) {
    const time: number = frame / 24;
    const pose: ReturnType<typeof evaluateDuelRescue>["pose"] = time < 48 ? rescue(time, "Carina").pose : evaluateDuelEnding(time, "Carina", entries, reference).pose;
    const value: number = pose.neck?.atlantoAxial?.rotation ?? 0;
    assert.ok(value >= axial.minimum && value <= axial.maximum, "Authored head controls must remain inside the actual public channel interval");
  }
  assert.ok(evaluateDuelEnding(48.15, "Harry", entries, reference).left.y > 0, "Root glance turn owns an explicit foot transfer");
  assert.throws((): void => { rescue(NaN, "Harry"); });
  assert.throws((): void => { evaluateDuelEnding(Infinity, "Harry", entries, reference); });
  assert.deepEqual(entries.Harry.position.toArray(), [1.3, 0.01, -1.3]);
}
