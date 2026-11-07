import assert from "node:assert/strict";

import { FilmVector as V } from "../../../../src/motion/rig/FilmVector";
import { filmHighestKnee } from "../../../../src/motion/rig/filmHighestKnee";

/**
 * The question-mark knee is the highest knee a thigh and shank allow for a hip and an ankle.
 *
 * Scenarios:
 * 1. The knee keeps both segment lengths and lies above every other admissible knee sampled around the circle.
 * 2. An ankle beyond the extended leg puts the knee on the straight line.
 */
export function test_film_highest_knee(): void {
  const hip: V.Value = [0, 1, 0];
  const ankle: V.Value = [0.6, 1.4, 0.1];
  const knee: V.Value = filmHighestKnee(hip, ankle, 0.45, 0.45);
  assert.ok(Math.abs(V.distance(hip, knee) - 0.45) < 1e-9);
  assert.ok(Math.abs(V.distance(knee, ankle) - 0.45) < 1e-9);
  const axis: V.Value = V.normalize(V.sub(ankle, hip));
  const centre: V.Value = V.add(hip, V.scale(axis, V.length(V.sub(ankle, hip)) / 2));
  const radius: number = V.distance(centre, knee);
  const u: V.Value = V.normalize(V.sub(knee, centre));
  const w: V.Value = V.normalize([axis[1] * u[2] - axis[2] * u[1], axis[2] * u[0] - axis[0] * u[2], axis[0] * u[1] - axis[1] * u[0]]);
  for (let index: number = 0; index < 36; index++) {
    const angle: number = (index * Math.PI) / 18;
    const other: V.Value = V.add(centre, V.add(V.scale(u, radius * Math.cos(angle)), V.scale(w, radius * Math.sin(angle))));
    assert.ok(other[1] <= knee[1] + 1e-9);
  }
  const straight: V.Value = filmHighestKnee(hip, [2, 1, 0], 0.45, 0.45);
  assert.ok(V.distance(straight, [0.45, 1, 0]) < 1e-9);
}
