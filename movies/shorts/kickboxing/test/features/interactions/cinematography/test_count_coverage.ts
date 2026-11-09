import type { IAutoMovieSchedule } from "@automovie/engine";
import assert from "node:assert/strict";

import { CountCoverage } from "../../../../src/interactions/cinematography/CountCoverage";
import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The count's coverage from the neutral corner.
 *
 * Scenarios: the shot is the two-shot of the referee over whichever fighter
 * the schedule makes fall, with the other fighter framed behind it, and no
 * shot without a fall; the camera takes the neutral corner the
 * standing fighter was not sent to; its bearing points from the two-shot
 * toward that corner.
 */
export function test_count_coverage(): void {
  const cast = polygonCast();
  const fall = (subject: string) => ({
    duration: 10,
    entries: [
      {
        subject,
        start: 1,
        end: 2,
        intent: KickboxingAction.intent(subject, {
          kind: "phase",
          phase: "fall",
          seconds: 1,
        }),
      },
    ],
  });
  assert.deepEqual(
    CountCoverage.shot(fall(cast.b.id) as unknown as IAutoMovieSchedule, cast),
    {
      counted: [cast.referee.id, cast.b.id],
      subjects: [cast.referee.id, cast.b.id, cast.a.id],
    },
  );
  assert.deepEqual(
    CountCoverage.shot(fall(cast.a.id) as unknown as IAutoMovieSchedule, cast),
    {
      counted: [cast.referee.id, cast.a.id],
      subjects: [cast.referee.id, cast.a.id, cast.b.id],
    },
  );
  assert.equal(
    CountCoverage.shot(
      { duration: 10, entries: [] } as unknown as IAutoMovieSchedule,
      cast,
    ),
    undefined,
  );
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
