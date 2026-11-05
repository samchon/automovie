import assert from "node:assert/strict";
import type { IAutoMovieHumanArmPose } from "@automovie/human";
import * as THREE from "three";

import { blendArmSeed } from "../../../src/actors/blendArmSeed";
import { blendHandNormal } from "../../../src/actors/blendHandNormal";

/**
 * Preserve fitted arm continuity and rigid normal-marker length through a half-turn.
 *
 * @evidence contracts/testing.md#observable-behavior Calls both actual transition helpers. An antipodal upward/downward palm course stays unit length through129samples, takes the explicitly fixedX half-turn and keeps a60mm marker60mm long at every sample. Clinical seed blending preserves the actual start degrees, midpoint and current hand opening without mutating either source. Ambiguous axes and invalid blends refuse.
 * @evidence contracts/testing.md#independent-cases Exact up/down endpoints give an analytic midpoint+Z and a maximum adjacent unit-vector chord under0.025. Literal10/30degree shoulder and80/40degree elbow endpoints supply20/60degree midpoint expectations. This pure transition check is not actual Human reach, contact or playback acceptance.
 */
export function test_hand_transition(): void {
  const up: THREE.Vector3 = new THREE.Vector3(0, 1, 0); const down: THREE.Vector3 = up.clone().negate(); const axis: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
  const origin: THREE.Vector3 = new THREE.Vector3(2, 1, -3); let previous: THREE.Vector3 | undefined;
  for (let index: number = 0; index <= 128; index++) {
    const normal: THREE.Vector3 = blendHandNormal(up, down, index / 128, axis);
    assert.ok(Math.abs(normal.length() - 1) < 1e-12);
    assert.ok(Math.abs(origin.clone().addScaledVector(normal, 0.06).distanceTo(origin) - 0.06) < 1e-12);
    if (previous !== undefined) assert.ok(normal.distanceTo(previous) < 0.025);
    previous = normal;
  }
  assert.ok(blendHandNormal(up, down, 0.5, axis).distanceTo(new THREE.Vector3(0, 0, 1)) < 1e-12);
  assert.throws((): void => { blendHandNormal(up, down, 0.5, up); });
  const first: IAutoMovieHumanArmPose = { shoulder: { flexion: 10 }, elbow: { flexion: 80 }, forearm: { pronation: -70 } };
  const last: IAutoMovieHumanArmPose = { shoulder: { flexion: 30 }, elbow: { flexion: 40 }, forearm: { pronation: 70 }, hand: { index: { mcpFlexion: 0 } } };
  const middle: IAutoMovieHumanArmPose = blendArmSeed(first, last, 0.5);
  assert.equal(middle.shoulder!.flexion, 20); assert.equal(middle.elbow!.flexion, 60); assert.equal(middle.forearm!.pronation, 0);
  assert.deepEqual(middle.hand, last.hand); assert.equal(first.elbow!.flexion, 80);
  assert.throws((): void => { blendArmSeed(first, last, NaN); });
}
