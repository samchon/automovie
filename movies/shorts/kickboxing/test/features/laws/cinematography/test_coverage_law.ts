import assert from "node:assert/strict";

import { CoverageLaw } from "../../../../src/laws/cinematography/CoverageLaw";

/**
 * The camera law orbits at a bounded rate, frames from the side away from
 * the referee and follows with lag.
 *
 * Scenarios: one orbit step never turns more than 0.9 rad/s times its
 * duration and reaches a near target exactly; the bearing is perpendicular
 * to the fighters' line on the side opposite the referee; the follow share is
 * in (0, 1) and grows with the step; framing goals carry the lens.
 */
export function test_coverage_law(): void {
  const step = 1 / 30;
  assert.ok(
    Math.abs(CoverageLaw.orbit(0, 3, step) - CoverageLaw.ORBIT * step) < 1e-12,
  );
  assert.equal(CoverageLaw.orbit(0, 0.01, step), 0.01);
  const bearing = CoverageLaw.bearing(
    { x: -1, z: 0 },
    { x: 1, z: 0 },
    { x: 0, z: 2 },
  );
  // The referee is on +z, so the camera looks from -z: bearing pi (from +z toward +x).
  assert.ok(Math.abs(Math.abs(bearing) - Math.PI) < 1e-9);
  const share = CoverageLaw.follow(step);
  assert.ok(share > 0 && share < 1 && CoverageLaw.follow(2 * step) > share);
  assert.equal(
    CoverageLaw.goal("medium", ["a"], 0).fieldOfView,
    CoverageLaw.FIELD_OF_VIEW,
  );
  assert.ok(
    CoverageLaw.goal("wide", ["a"], 0).fieldOfView > CoverageLaw.FIELD_OF_VIEW,
  );
}
