import assert from "node:assert/strict";
import * as THREE from "three";

import { evaluateDuelSteps } from "../../../src/evaluateDuelSteps";

/**
 * @evidence contracts/testing.md#observable-behavior Real transfer evaluation must retain the stance foot, lift only the moving foot, finish at explicit path-derived landings and reproduce arbitrary requested times. Independent synthetic witnesses exercise different left/right offsets and a translating, turning root.
 * @evidence contracts/testing.md#independent-cases Entry is preserved before time zero; every step's two neighboring samples converge within a metre tolerance derived from their two-microsecond gap. Final feet remain fixed after completion. Zero/negative/NaN durations, nonfinite time and negative lift refuse instead of producing fabricated footprints. These logic checks do not admit an actual Human pose.
 */
export function test_duel_steps(): void {
  const entry: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(0, 0, 0.12), right: new THREE.Vector3(0, 0, -0.12) };
  const reference: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(0, 0, 0.12), right: new THREE.Vector3(0, 0, -0.12) };
  const path: (time: number) => { position: THREE.Vector3; yaw: number } = (time: number): { position: THREE.Vector3; yaw: number } => ({ position: new THREE.Vector3(time * 0.1, 0, 0), yaw: time * 0.2 });
  const at: (time: number) => ReturnType<typeof evaluateDuelSteps> = (time: number): ReturnType<typeof evaluateDuelSteps> => evaluateDuelSteps(time, [0.5, 0.5, 0.5], "left", entry, reference, path);
  assert.deepEqual(at(-1), entry);
  assert.deepEqual(at(0.1).right, entry.right);
  assert.ok(at(0.25).left.y > 0.04);
  assert.deepEqual(at(0.6).left, at(0.9).left);
  for (const boundary of [0.5, 1, 1.5]) {
    const before: ReturnType<typeof at> = at(boundary - 1e-6);
    const after: ReturnType<typeof at> = at(boundary + 1e-6);
    assert.ok(before.left.distanceTo(after.left) < 1e-5);
    assert.ok(before.right.distanceTo(after.right) < 1e-5);
  }
  const final: ReturnType<typeof at> = at(1.5);
  assert.deepEqual(at(9), final);
  const frozen: ReturnType<typeof at> = at(0.75);
  at(0.1);
  assert.deepEqual(at(0.75), frozen);
  assert.deepEqual(entry.left.toArray(), [0, 0, 0.12]);
  for (const durations of [[0], [-1], [NaN]])
    assert.throws((): void => { evaluateDuelSteps(0, durations, "left", entry, reference, path); });
  assert.throws((): void => { at(Infinity); });
  assert.throws((): void => { evaluateDuelSteps(0, [1], "left", entry, reference, path, -1); });
}
