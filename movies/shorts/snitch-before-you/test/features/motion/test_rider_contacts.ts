import assert from "node:assert/strict";
import * as THREE from "three";

import { createRider } from "../../../src/createRider";
import { humanParameters } from "../../../src/humanParameters";
import { sampleFlight } from "../../../src/sampleFlight";
import { shaftPoint } from "../../../src/shaftPoint";

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
    const orientation: THREE.Quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.15, 0.25, 0.1));
    rider.update({}, root, {}, 0, { orientation });
    const turned: THREE.Vector3 = rider.point("rightHand").add(new THREE.Vector3(0.02, 0.03, 0.01));
    rider.update({}, root, { right: turned }, 0, { orientation, shaftFrames: { right: orientation } });
    assert.ok(rider.point("rightHand").distanceTo(turned) < 0.015, "Shared heading/bank frame lost its world contact");
    const hanging = { arms: { left: {}, right: { shoulder: { flexion: 160 }, elbow: { flexion: 15 } } } };
    rider.update(hanging, root);
    const held: THREE.Vector3 = rider.point("rightHand").add(new THREE.Vector3(0, 0.12, 0));
    const span: number = rider.point("rightUpperArm").distanceTo(rider.point("rightLowerArm")) + rider.point("rightLowerArm").distanceTo(rider.point("rightHand"));
    rider.update(hanging, root, { right: held }, 0, { reachSupport: { side: "right", amount: 1 } });
    assert.ok(rider.point("hips").y > root.y + 0.03, "Sole grip did not constrain the unsupported body root");
    assert.ok(rider.point("rightHand").distanceTo(held) < 1e-9, "Sole held grip did not own the floating root");
    assert.ok(Math.abs(rider.point("rightUpperArm").distanceTo(rider.point("rightLowerArm")) + rider.point("rightLowerArm").distanceTo(rider.point("rightHand")) - span) < 1e-9, "Contact root correction changed anatomical arm length");
    const turning = { ...hanging, pelvis: { rotation: 25 }, spine: { lumbar: { rotation: 5 }, thoracic: { rotation: 40 } } };
    const anchored: ReturnType<typeof rider.update> = rider.update(turning, root, { right: held }, 0, { orientation, reachSupport: { side: "right", amount: 1 } });
    assert.ok(rider.point("rightHand").distanceTo(held) < 1e-9 && anchored.error < 1e-9, "Body turn detached the sole material grip");
    assert.equal(anchored.clamps.length, 0, "Rigid placement changed clinical limits");
    for (let i: number = 0; i <= 60; i++) {
      const frame: ReturnType<typeof sampleFlight> = sampleFlight(23 + i / 24);
      rider.update(frame.harry.pose, frame.harry.pelvis, frame.harry.wrists, frame.harry.bank, { orientation: frame.harry.orientation, reachSupport: frame.harry.reachSupport });
      const head: THREE.Vector3 = rider.object.localToWorld(rider.object.worldToLocal(rider.point("head")).add(new THREE.Vector3(0, 0.08, 0)));
      const shaft: THREE.Line3 = new THREE.Line3(shaftPoint(frame.harryBroom, -0.65, 0, 0), shaftPoint(frame.harryBroom, 1.15, 0, 0));
      assert.ok(head.distanceTo(shaft.closestPointToPoint(head, true, new THREE.Vector3())) >= 0.165, "Fixed-pivot slip passed the head through the old shaft");
    }
    assert.throws((): void => { humanParameters(Number.NaN, false); });
  } finally {
    rider.dispose();
  }
}
