import assert from "node:assert/strict";
import * as THREE from "three";

import { createRider } from "../../../src/createRider";
import { humanParameters } from "../../../src/humanParameters";

/**
 * Exercise public Human FK, reachable wrist fitting and absolute replay through
 * the actual polygon rider adapter, without a browser or GPU.
 *
 * @evidence contracts/testing.md#observable-behavior Builds the real rider and fits displaced wrist targets, observes actual displayed world joint positions and repeats an earlier absolute pose after another state. Catches missing rig names, contact/root frame errors and evaluation-history drift; moving pixels remain a separate Viewer check.
 * @evidence contracts/testing.md#independent-cases Targets shift a neutral hand only 5 cm forward and 8 cm up, within a human arm's local reachable neighborhood. A 15 mm endpoint tolerance is the coarse hint's wrist-contact budget, independent of returned solver error. Replay uses a different intervening root and pose; malformed stature is separately refused.
 */
export function test_rider_contacts(): void {
  const rider: ReturnType<typeof createRider> = createRider(humanParameters(1.72, true), 0x315a48, true, false);
  const root: THREE.Vector3 = new THREE.Vector3(2, 3, -1);
  try {
    rider.update({}, root);
    const target: THREE.Vector3 = rider.point("rightHand").add(new THREE.Vector3(0.05, 0.08, 0));
    const fitted: ReturnType<typeof rider.update> = rider.update({}, root, { right: target });
    assert.ok(rider.point("rightHand").distanceTo(target) < 0.015, `Wrist misses ${fitted.error} m`);
    const accepted: THREE.Vector3 = rider.point("rightHand");
    rider.update({ spine: { lumbar: { flexion: 20 } } }, new THREE.Vector3(-4, 7, 2));
    rider.update({}, root, { right: target });
    assert.ok(rider.point("rightHand").distanceTo(accepted) < 1e-9, "Absolute seeking retains a previous pose");
    assert.throws((): void => { humanParameters(Number.NaN, false); });
  } finally {
    rider.dispose();
  }
}
