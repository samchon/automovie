import assert from "node:assert/strict";

import type { IAutoMovieSchedule } from "@automovie/engine";

import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { RefereeTrack } from "../../../../src/interactions/officiating/RefereeTrack";
import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { OfficiatingAction } from "../../../../src/laws/officiating/OfficiatingAction";
import { RefereePosition } from "../../../../src/laws/officiating/RefereePosition";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * After a knockdown the referee stays a step clear of the fallen fighter,
 * waves it off from between the fighters and walks to the winner to raise
 * his arm.
 *
 * Scenarios, on a hand-placed schedule (B falls at 1 s, the wave-off from
 * 3 s, the winner's raise from 5 s): from the fall on his gap to the lying
 * body is never less than one of his steps; attending, he looks at the
 * lying body's centre; waving it off, he stands nearer the standing
 * fighter than the body's centre and looks at him; the winner is the one
 * who did not fall; the raise waits for his arrival beside the winner, who
 * he looks at; the attending point lies beyond the body from the standing
 * fighter; a point pushed off the body lands on its clearance.
 */
export function test_referee_knockdown(): void {
  const cast = polygonCast();
  const entry = (
    index: number,
    subject: string,
    intent: IAutoMovieSchedule.IEntry["intent"],
    start: number,
    end: number,
  ): IAutoMovieSchedule.IEntry => ({ index, subject, intent, start, end });
  const schedule: IAutoMovieSchedule = {
    duration: 10,
    entries: [
      entry(
        0,
        cast.b.id,
        KickboxingAction.intent(cast.b.id, {
          kind: "phase",
          phase: "fall",
          seconds: 1.6,
        }),
        1,
        2.6,
      ),
      entry(
        1,
        cast.referee.id,
        OfficiatingAction.intent(cast.referee.id, {
          kind: "signal",
          signal: "knockout",
          seconds: 1.2,
        }),
        3,
        4.2,
      ),
      entry(
        2,
        cast.referee.id,
        OfficiatingAction.intent(cast.referee.id, {
          kind: "signal",
          signal: "winner",
          seconds: 4,
        }),
        5,
        9,
      ),
    ],
  };
  const track = RefereeTrack.resolve(cast, schedule, schedule.duration);
  const fall = RefereeTrack.fallStart(schedule);
  assert.equal(fall, 1);
  assert.equal(RefereeTrack.winner(cast, schedule), cast.a.id);
  const body = RefereeTrack.footprint(cast, schedule, fall);
  const centre = {
    x: (body.from.x + body.to.x) / 2,
    z: (body.from.z + body.to.z) / 2,
  };
  const a = BoutLaws.origin(schedule, cast.a.id, 0, cast).point;
  const step = StanceShape.step(cast.referee.body.measure);
  for (let k = Math.ceil(fall / RefereeTrack.STEP); k < track.points.length; k++) {
    const t = k * RefereeTrack.STEP;
    const r = track.points[k]!;
    const look = track.looks[k]!;
    const gap = RefereePosition.gap(r, body);
    assert.ok(gap >= step - 1e-6, `gap ${gap.toFixed(3)} m at ${t}`);
    const at = (p: { x: number; z: number }): boolean =>
      Math.hypot(look.x - p.x, look.z - p.z) < 1e-9;
    if (t >= 3.5 && t < 4.2) {
      assert.ok(at(a), `looks at the winner while waving off at ${t}`);
      assert.ok(
        Math.hypot(r.x - a.x, r.z - a.z) <
          Math.hypot(centre.x - a.x, centre.z - a.z),
        `between the fighters at ${t}`,
      );
    } else if (t >= 5 && t < 9) assert.ok(at(a), `looks at the winner at ${t}`);
    else if (t >= 2.6 && t < 3) assert.ok(at(centre), `attends at ${t}`);
  }
  // The raise waits for the referee's walk, then completes inside the signal.
  const before = RefereeTrack.raising(cast, schedule, 5);
  const late = RefereeTrack.raising(cast, schedule, 8.5);
  assert.ok(before !== null && before < 0, `raise before arrival ${before}`);
  assert.ok(late !== null && late > 0 && late < 1, `raise late ${late}`);
  assert.equal(RefereeTrack.raising(cast, schedule, 4), null);
  const beside = RefereeTrack.beside(cast, schedule, 8.5)!;
  const r = track.points[Math.round(8.5 / RefereeTrack.STEP)]!;
  assert.ok(Math.hypot(r.x - beside.x, r.z - beside.z) < 1e-6, "arrived");

  const standing = { x: -2, z: 0 };
  const lying = { from: { x: 0, z: 0 }, to: { x: 0, z: 0.8 }, radius: 0.4 };
  const point = RefereePosition.attend(lying, standing, 0.3);
  assert.ok(point.x > 0, "beyond the body");
  assert.ok(Math.abs(RefereePosition.gap(point, lying) - 0.3) < 1e-6);
  const pushed = RefereePosition.clear({ x: 0.1, z: 0.4 }, lying, 0.3);
  assert.ok(Math.abs(RefereePosition.gap(pushed, lying) - 0.3) < 1e-9);
}
