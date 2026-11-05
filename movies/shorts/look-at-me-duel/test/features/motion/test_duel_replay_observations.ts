import assert from "node:assert/strict";
import * as THREE from "three";

import { assertDuelReplayObservations } from "../../../src/assertDuelReplayObservations";
import { createDuelCapMotion } from "../../../src/createDuelCapMotion";
import { createDuelCourt } from "../../../src/createDuelCourt";
import { createDuelFragmentMotion } from "../../../src/createDuelFragmentMotion";

/**
 * @evidence contracts/testing.md#observable-behavior Fixed-actor playback cannot hide changed live cap/material/shield/debris facts behind old recorded observations. Matching structured physical data passes independently of JSON property order; incompatible or incomplete outcomes refuse.
 * @evidence contracts/testing.md#independent-cases Real court geometry/cap-floor calculations and three actual fragment/triangle contacts supply current facts in a synthetic shield placement. Separate negative controls alter material, impact, fragment position, shield anchor, clearance/admission and recovery chronology. Missing physics and causal failures also refuse. Inputs remain unchanged; no cached actors, movie or external generation are approved by this metadata test.
 */
export function test_duel_replay_observations(): void {
  const court: ReturnType<typeof createDuelCourt> = createDuelCourt();
  try {
    const cap: ReturnType<typeof createDuelCapMotion> = createDuelCapMotion(court.cap, 40.875, court.bearing, court.base);
    const impact: THREE.Vector3 = cap.at(cap.impactSeconds).centre;
    court.shield.position.set(0.85, 0.9, impact.z);
    court.shield.updateMatrixWorld(true);
    const fragments: ReturnType<typeof createDuelFragmentMotion> = createDuelFragmentMotion(court.fragments, court.shield, impact, cap.impactSeconds);
    const current: Parameters<typeof assertDuelReplayObservations>[1] = { webBreakSeconds: cap.webBreakSeconds, capReleaseSeconds: 40.875, capImpactSeconds: cap.impactSeconds, capSettledSeconds: cap.settledSeconds, capPhysics: cap.physics, shieldRaisedAt: 40.5, shieldAnchor: [0.85, 1.8, impact.z], fragments: fragments.map((item: ReturnType<typeof createDuelFragmentMotion>[number]): Parameters<typeof assertDuelReplayObservations>[1]["fragments"][number] => ({ contact: { ...item.contact, centre: item.contact.centre.toArray() }, floorSeconds: item.floorSeconds })) };
    const end: number = Math.max(cap.settledSeconds, ...fragments.map((item: ReturnType<typeof createDuelFragmentMotion>[number]): number => item.floorSeconds));
    const recorded: Record<string, unknown> = structuredClone({ ...current, capCleared: true, escapeCompletedAt: 40, recoveryReadyAt: Math.ceil(end * 24) / 24, causalFailures: [] });
    const original: string = JSON.stringify(recorded);
    assertDuelReplayObservations(recorded, current);
    assertDuelReplayObservations(Object.fromEntries(Object.entries(recorded).reverse()), current);
    assert.equal(JSON.stringify(recorded), original);
    for (const patch of [{ capPhysics: undefined }, { capCleared: false }, { capImpactSeconds: cap.impactSeconds + 0.1 }, { shieldAnchor: [0.86, 1.8, impact.z] }, { recoveryReadyAt: end - 0.1 }, { causalFailures: [{ frame: 975, reason: "unresolved" }] }]) {
      assert.throws((): void => { assertDuelReplayObservations({ ...recorded, ...patch }, current); });
    }
    const material: typeof current = structuredClone(current);
    material.capPhysics.floor.friction = 0.7;
    assert.throws((): void => { assertDuelReplayObservations({ ...recorded, capPhysics: material.capPhysics }, current); });
    const displaced: typeof current = structuredClone(current);
    displaced.fragments[0]!.contact.centre[0]! += 0.1;
    assert.throws((): void => { assertDuelReplayObservations({ ...recorded, fragments: displaced.fragments }, current); });
  } finally { court.dispose(); }
}
