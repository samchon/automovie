import type { IAutoMovieAffordance, IAutoMovieMotionClock, IAutoMovieMotionHumanPropReader, IAutoMovieRigidTransform } from "@automovie/interface";
import { stickBallClock, stickBallModel, stickBallPoint } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** A stick's blade contact. */
const BLADE: IAutoMovieAffordance = {
  id: "blade",
  kind: "surface",
  frame: {
    translation: { x: 0, y: 0, z: 0.1 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
};

/**
 * The stick-ball law's own logic: the stroke's timetable, the stick's frame and
 * its declared working points.
 *
 * Scenarios:
 *
 * 1. A 0.4 s take and a 0.75 s swing grip at 0.4 s, strike at 55 % of the swing
 *    (0.8125 s), end the follow-through at 85 % (1.0375 s) and last 1.15 s.
 * 2. Turned a quarter about +Z at (1, 2, 3), the shaft axis `UP` lands along -X,
 *    at (0, 2, 3).
 * 3. The stick's `blade` is its declared contact; an undeclared `heel` is refused.
 */
export function test_unit_motions_sport_stick_ball(): void {
  const clock: IAutoMovieMotionClock = stickBallClock(0.4, 0.75);
  TestValidator.predicate(
    "the stroke's marks",
    nclose(clock.at("gripped"), 0.4, 1e-12) &&
      nclose(clock.at("stroke"), 0.8125, 1e-12) &&
      nclose(clock.at("strokeEnd"), 1.0375, 1e-12) &&
      nclose(clock.duration, 1.15, 1e-12),
  );
  const frame: IAutoMovieRigidTransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
  };
  TestValidator.predicate(
    "the stick's frame",
    vclose(
      stickBallModel.world(frame, stickBallModel.UP),
      { x: 0, y: 2, z: 3 },
      1e-12,
    ),
  );
  const reader: IAutoMovieMotionHumanPropReader = {
    prop: { subject: "stick", frame, points: {}, affordances: [BLADE] },
    frame: (): IAutoMovieRigidTransform => frame,
  };
  TestValidator.predicate(
    "declared, and missing",
    stickBallPoint(reader, "blade") === BLADE &&
      throwsError(() => stickBallPoint(reader, "heel")),
  );
}
