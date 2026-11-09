import assert from "node:assert/strict";

import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The guard's root drop bends the displayed knees by the stance's flexion.
 *
 * Scenarios: with the feet under the hips the drop is the straight leg less
 * the bent leg's chord; over the stance's floor run the chord leans, so the
 * guard sinks further; a leg from the lowered hip joint to its planted ankle
 * then has exactly the chord of the stance's knee flexion, which lies inside
 * the translated range.
 */
export function test_stance_drop(): void {
  const { a, b } = polygonCast();
  for (const fighter of [a, b]) {
    const m = fighter.body.measure;
    const flexion: number = StanceShape.KNEE_FLEXION;
    const interior: number = Math.PI - (flexion * Math.PI) / 180;
    const chord: number = Math.sqrt(
      m.thigh ** 2 + m.shank ** 2 - 2 * m.thigh * m.shank * Math.cos(interior),
    );
    assert.ok(
      Math.abs(StanceShape.drop(m, flexion) - (m.thigh + m.shank - chord)) <
        1e-12,
    );
    const run: number = StanceShape.run(m);
    assert.ok(run > 0);
    const sink: number = StanceShape.sink(m);
    assert.ok(sink > StanceShape.drop(m, flexion));
    assert.equal(StanceShape.guard(m).drop, sink);
    const leg: number = Math.hypot(run, m.thigh + m.shank - sink);
    assert.ok(Math.abs(leg - chord) < 1e-12);
    const bent: number =
      180 -
      (Math.acos(
        (m.thigh ** 2 + m.shank ** 2 - leg ** 2) / (2 * m.thigh * m.shank),
      ) *
        180) /
        Math.PI;
    assert.ok(Math.abs(bent - flexion) < 1e-9);
    assert.ok(
      bent >= StanceShape.KNEE_FLEXION_RANGE[0] &&
        bent <= StanceShape.KNEE_FLEXION_RANGE[1],
    );
  }
}
