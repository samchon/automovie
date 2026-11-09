import assert from "node:assert/strict";

import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { RefereeTrack } from "../../../../src/interactions/officiating/RefereeTrack";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { OfficiatingAction } from "../../../../src/laws/officiating/OfficiatingAction";
import { RefereePosition } from "../../../../src/laws/officiating/RefereePosition";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * After the knockdown the referee stays a step clear of the fallen fighter,
 * faces him and keeps the standing fighter in view.
 *
 * Scenarios, with the study's targets (docs/research/officiating/
 * referee.md#targets): from the fall to the end of the film his gap to the
 * lying body is never less than one of his steps; from the count's first
 * raised hand (157 s) he looks at the lying body's centre and A stays within
 * 60 degrees of his facing; the attending point lies beyond the body from
 * the standing fighter; a point pushed off the body lands on its clearance.
 */
export function test_referee_knockdown(): void {
  const { cast, schedule, referee } = polygonFilm();
  const fall = RefereeTrack.fallStart(schedule);
  assert.ok(Math.abs(fall - 150) < 1e-9, `fall at ${fall}`);
  const body = RefereeTrack.footprint(cast, schedule, fall);
  const step = StanceShape.step(cast.referee.body.measure);
  for (
    let k = Math.ceil(fall / RefereeTrack.STEP);
    k < referee.points.length;
    k++
  ) {
    const t = k * RefereeTrack.STEP;
    const r = referee.points[k]!;
    const gap = RefereePosition.gap(r, body);
    assert.ok(gap >= step - 1e-6, `gap ${gap.toFixed(3)} m at ${t}`);
    // While raising the winner's hand he stands by the winner and looks at him.
    const raising = schedule.entries.some(
      (e) =>
        e.subject === cast.referee.id &&
        e.start <= t &&
        t < e.end &&
        OfficiatingAction.read(e.intent).signal === "winner",
    );
    if (raising) {
      const a = BoutLaws.origin(schedule, cast.a.id, t, cast).point;
      const look = referee.looks[k]!;
      assert.ok(Math.hypot(look.x - a.x, look.z - a.z) < 1e-9);
      continue;
    }
    if (t < 157) continue;
    const look = referee.looks[k]!;
    assert.ok(
      Math.hypot(
        look.x - (body.from.x + body.to.x) / 2,
        look.z - (body.from.z + body.to.z) / 2,
      ) < 1e-9,
      `looks at the fallen fighter at ${t}`,
    );
    const a = BoutLaws.origin(schedule, cast.a.id, t, cast).point;
    const facing = Math.atan2(look.z - r.z, look.x - r.x);
    const toward = Math.atan2(a.z - r.z, a.x - r.x);
    const off = Math.abs(
      Math.atan2(Math.sin(toward - facing), Math.cos(toward - facing)),
    );
    assert.ok(off <= RefereePosition.FIELD, `A ${off} rad off at ${t}`);
  }
  const standing = { x: -2, z: 0 };
  const lying = { from: { x: 0, z: 0 }, to: { x: 0, z: 0.8 }, radius: 0.4 };
  const point = RefereePosition.attend(lying, standing, 0.3);
  assert.ok(point.x > 0, "beyond the body");
  assert.ok(Math.abs(RefereePosition.gap(point, lying) - 0.3) < 1e-6);
  const pushed = RefereePosition.clear({ x: 0.1, z: 0.4 }, lying, 0.3);
  assert.ok(Math.abs(RefereePosition.gap(pushed, lying) - 0.3) < 1e-9);
}
