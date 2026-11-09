import assert from "node:assert/strict";

import { CountCoverage } from "../../../../src/interactions/cinematography/CountCoverage";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The count's coverage from the neutral corner.
 *
 * Scenarios: the shot cuts between the referee with the fallen man and the
 * winner each hold; the camera takes the neutral corner the standing
 * fighter was not sent to; its bearing points from the framed men toward
 * that corner.
 */
export function test_count_coverage(): void {
  const hold: number = 2.4;
  assert.deepEqual(CountCoverage.subjects(0, hold), ["referee", "b"]);
  assert.deepEqual(CountCoverage.subjects(hold + 0.1, hold), ["a"]);
  assert.deepEqual(CountCoverage.subjects(2 * hold + 0.1, hold), [
    "referee",
    "b",
  ]);
  const cast = polygonCast();
  const h: number = cast.ring.half;
  const corner = CountCoverage.corner(cast, { x: h - 0.4, z: h - 0.4 });
  assert.deepEqual(corner, { x: -h, z: -h });
  const bearing: number = CountCoverage.bearing(
    [
      { x: 0, z: 0 },
      { x: 0.4, z: 0.2 },
    ],
    { x: -h, z: -h },
  );
  const toward = { x: -h - 0.2, z: -h - 0.1 };
  const length: number = Math.hypot(toward.x, toward.z);
  assert.ok(Math.abs(Math.sin(bearing) - toward.x / length) < 1e-9);
  assert.ok(Math.abs(Math.cos(bearing) - toward.z / length) < 1e-9);
}
