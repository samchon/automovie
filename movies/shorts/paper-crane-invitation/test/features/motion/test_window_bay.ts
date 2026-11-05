import assert from "node:assert/strict";
import * as THREE from "three";

import { createWindowBay } from "../../../src/createWindowBay";

/**
 * Check actual generated bench support and cup support against setting dimensions.
 *
 * @evidence contracts/testing.md#observable-behavior Builds the real scene geometry headlessly, measures its bench bounds, four separate support legs and two cup-root placements. This catches wrong seat height/extent, missing legs and unsupported or merged cup positions; it does not establish visual contact or dynamic carrying.
 * @evidence contracts/testing.md#independent-cases Corridor#space independently requires a1.8m by0.45m bench with top0.45m and four legs reaching the floor; screenplay#invitation requires two sill-supported cups0.25m apart at height0.95m. Floating-point tolerances allow Float32 geometry rounding, not artistic scale changes. Real playback owns the assembled fit and motion.
 */
export function test_window_bay(): void {
  const bay: ReturnType<typeof createWindowBay> = createWindowBay();
  try {
    bay.object.updateMatrixWorld(true);
    const bounds: THREE.Box3 = new THREE.Box3().setFromObject(bay.bench);
    const size: THREE.Vector3 = bounds.getSize(new THREE.Vector3());
    assert.ok(Math.abs(size.x - 1.8) < 1e-6);
    assert.ok(Math.abs(size.z - 0.45) < 1e-6);
    assert.ok(Math.abs(bounds.min.y) < 1e-6);
    assert.ok(Math.abs(bounds.max.y - 0.45) < 1e-6);
    const legs: THREE.Object3D[] = bay.bench.children.filter(
      (item: THREE.Object3D): boolean => item.position.y < 0.3,
    );
    assert.equal(legs.length, 4);
    assert.equal(bay.cups.length, 2);
    assert.equal(bay.cups[1].position.x - bay.cups[0].position.x, 0.25);
    for (const cup of bay.cups) {
      assert.equal(cup.position.y, 0.95);
      assert.equal(cup.rotation.x, 0); assert.equal(cup.rotation.z, 0);
    }
  } finally {
    bay.dispose();
  }
  assert.equal(bay.object.children.length, 0);
}
