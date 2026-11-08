import assert from "node:assert/strict";

import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { RefereeTrack } from "../../../../src/interactions/officiating/RefereeTrack";
import { RefereePosition } from "../../../../src/laws/officiating/RefereePosition";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * The referee's resolved path meets the officiating targets.
 *
 * Scenarios, with the study's thresholds (docs/research/officiating/
 * referee.md#targets): a side view of the fighters' line for at least 90% of
 * the action; never between the fighters; at least one metre of walking in
 * every fifteen-second phase; never faster than 1.39 m/s; inside the ropes.
 */
export function test_referee_track(): void {
  const { schedule, referee, cast } = polygonFilm();
  const step = RefereeTrack.STEP;
  let side = 0;
  let samples = 0;
  for (let k = 0; k * step < 150; k++) {
    const t = k * step;
    const r = referee.points[k]!;
    const a = BoutLaws.origin(schedule, "a", t, cast).point;
    const b = BoutLaws.origin(schedule, "b", t, cast).point;
    if (RefereePosition.view(r, a, b) >= RefereePosition.SIDE_VIEW) side++;
    samples++;
    assert.ok(
      !RefereePosition.between(
        r,
        a,
        b,
        cast.referee.body.measure.shoulderHalfWidth * 2,
      ),
      `between at ${t}`,
    );
    assert.ok(Math.max(Math.abs(r.x), Math.abs(r.z)) < cast.ring.half);
    if (k > 0) {
      const p = referee.points[k - 1]!;
      assert.ok(
        Math.hypot(r.x - p.x, r.z - p.z) <= RefereePosition.SPEED * step + 1e-9,
      );
    }
  }
  assert.ok(side / samples >= 0.9, `side view ${side / samples}`);
  for (let phase = 0; phase < 10; phase++) {
    let walked = 0;
    for (
      let k = Math.round((phase * 15) / step) + 1;
      k <= Math.round(((phase + 1) * 15) / step);
      k++
    )
      walked += Math.hypot(
        referee.points[k]!.x - referee.points[k - 1]!.x,
        referee.points[k]!.z - referee.points[k - 1]!.z,
      );
    assert.ok(walked >= 1, `phase ${phase + 1} walked ${walked}`);
  }
}
