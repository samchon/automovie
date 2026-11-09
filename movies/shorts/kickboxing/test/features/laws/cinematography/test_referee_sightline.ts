import assert from "node:assert/strict";

import { CoverageLaw } from "../../../../src/laws/cinematography/CoverageLaw";

/**
 * The bearing turns the least that keeps the referee beside the fighters.
 *
 * Scenarios: a referee standing behind the fighters' midpoint on the view's
 * axis is cleared by the smallest turn, after which his body no longer
 * overlaps either fighter's across the view; a referee already beside them
 * keeps the bearing.
 */
export function test_referee_sightline(): void {
  const a = { x: -0.5, z: 0 };
  const b = { x: 0.5, z: 0 };
  const width: number = 0.3;
  // Side-on from -z looking along +z: bearing pi (from +Z toward +X).
  const bearing: number = Math.PI;
  const behind = { x: 0, z: 1.5 };
  const turned: number = CoverageLaw.unblocked(bearing, a, b, behind, width);
  assert.notEqual(turned, bearing);
  const across = (p: { x: number; z: number }): number =>
    p.x * Math.cos(turned) - p.z * Math.sin(turned);
  for (const f of [a, b])
    assert.ok(Math.abs(across(f) - across(behind)) >= 2 * width - 1e-9);
  const beside = { x: 2, z: 1.5 };
  assert.equal(CoverageLaw.unblocked(bearing, a, b, beside, width), bearing);
}
