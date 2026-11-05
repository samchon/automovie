import assert from "node:assert/strict";
import * as THREE from "three";

import { createDuelCourt } from "../../../src/createDuelCourt";
import { createDuelFragmentMotion } from "../../../src/createDuelFragmentMotion";

/**
 * @evidence contracts/testing.md#observable-behavior Three actual court boxes must encounter actual placed shield triangles, preserve a bounded separated/intersecting bracket, stop horizontal translation and settle on their own lower faces. Evaluating arbitrary times preserves those positions. Moving the shield out of their paths refuses instead of reporting scripted interception.
 * @evidence contracts/testing.md#independent-cases An explicit synthetic wand-tip/oval placement and principal impact centre/time create this component fixture, not a film observation. Every contact follows impact and precedes its floor stop, the refined bracket is below1e-8s, and post-contact X/Z remain fixed. Actual settled Box3 minima must beY=0 within1e-8m. Population, nonfinite-time and genuinely missed-shield cases refuse.
 */
export function test_duel_fragments(): void {
  const court: ReturnType<typeof createDuelCourt> = createDuelCourt();
  try {
    court.shield.position.set(0.86, 0.90, -1.60);
    court.object.updateMatrixWorld(true);
    const impact: number = 41.6;
    const trajectories: ReturnType<typeof createDuelFragmentMotion> = createDuelFragmentMotion(court.fragments, court.shield, new THREE.Vector3(1.7, 0.125, -1.45), impact);
    assert.equal(trajectories.length, 3);
    for (let index: number = 0; index < trajectories.length; index++) {
      const trajectory: (typeof trajectories)[number] = trajectories[index]!;
      assert.equal(trajectory.at(impact - 0.01).visible, false);
      assert.ok(trajectory.contact.seconds > impact && trajectory.floorSeconds > trajectory.contact.seconds);
      assert.ok(trajectory.contact.firstIntersectionSeconds - trajectory.contact.seconds < 1e-8);
      const before: ReturnType<typeof trajectory.at> = trajectory.at(trajectory.contact.seconds - 0.01);
      const after: ReturnType<typeof trajectory.at> = trajectory.at(trajectory.contact.seconds + 0.01);
      assert.ok(before.centre.x > after.centre.x);
      assert.equal(after.stoppedByShield, true);
      assert.equal(after.centre.x, trajectory.contact.centre.x);
      assert.equal(after.centre.z, trajectory.contact.centre.z);
      const landed: ReturnType<typeof trajectory.at> = trajectory.at(60);
      court.fragments[index]!.position.copy(landed.centre);
      court.object.updateMatrixWorld(true);
      assert.ok(Math.abs(new THREE.Box3().setFromObject(court.fragments[index]!).min.y) < 1e-8);
      trajectory.at(impact);
      assert.deepEqual(trajectory.at(60), landed);
      assert.throws((): void => { trajectory.at(NaN); });
    }
    court.shield.position.z += 10;
    court.object.updateMatrixWorld(true);
    assert.throws((): void => { createDuelFragmentMotion(court.fragments, court.shield, new THREE.Vector3(1.7, 0.125, -1.45), impact); });
    assert.throws((): void => { createDuelFragmentMotion(court.fragments.slice(1), court.shield, new THREE.Vector3(1.7, 0.125, -1.45), impact); });
  } finally { court.dispose(); }
}
