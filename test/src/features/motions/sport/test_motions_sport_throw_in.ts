import { AutoMovieEngineGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBallSport,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  motionClock
} from "../../../../../packages/motions/src/compose/internal/motionClock";
import {
  throwInRelease
} from "../../../../../packages/motions/src/sport/internal/throwInRelease";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * `throwInRelease` releases a throw-in's ball at the stroke: both hands grip it
 * until then, and it launches on the drag-free path rising at the given angle
 * through the aimed point (the range equation).
 *
 * The ball leaves (0, 2, 0) at 30 degrees toward (0, 1, 10); the stroke falls
 * at 0.5 s of a 1 s clock.
 *
 * Scenarios:
 *
 * 1. Both hands grip the ball to half the action.
 * 2. The launch at 0.5 s rises at 30 degrees and its parabola passes 1 m lower 10
 *    m on, at standard gravity.
 * 3. Without a prop there is nothing to release.
 * 4. Without an aimed point, or with one above the rising line, it is refused.
 */
export function test_motions_sport_throw_in(): void {
  const clock: IAutoMovieMotionClock = motionClock.sequence([
    { name: "ready", seconds: 0.5 },
    { name: "stroke", seconds: 0.5 },
  ]);
  const point: IAutoMovieVector3 = { x: 0, y: 2, z: 0 };
  const params: IAutoMovieMotionHumanBallSport.IParams = {
    kind: "throwIn",
    prop: "ball",
    at: { x: 0, y: 1, z: 10 },
  };
  const released: ReturnType<typeof throwInRelease> = throwInRelease(
    params,
    clock,
    point,
    30,
  );

  // 1. The grips.
  TestValidator.equals(
    "both hands until the stroke",
    released!.contacts.map(
      (c: IAutoMovieMotionHumanContactWindow): (string | number)[] => [
        c.part,
        c.kind,
        c.from,
        c.to,
      ],
    ),
    [
      ["leftHand", "grip", 0, 0.5],
      ["rightHand", "grip", 0, 0.5],
    ],
  );

  // 2. The launch.
  const v: IAutoMovieVector3 = released!.launches[0]!.velocity;
  const t: number = 10 / v.z;
  TestValidator.predicate(
    "the aimed parabola",
    released!.launches.length === 1 &&
      released!.launches[0]!.seconds === 0.5 &&
      nclose(Math.atan2(v.y, v.z), Math.PI / 6, 1e-12) &&
      nclose(v.y * t - (AutoMovieEngineGravity.STANDARD * t * t) / 2, -1, 1e-9),
  );

  // 3. and 4. Nothing to release, or no path.
  TestValidator.predicate(
    "no prop, no aim, no path",
    throwInRelease({ kind: "throwIn" }, clock, point, 30) === undefined &&
      throwsError(() =>
        throwInRelease({ kind: "throwIn", prop: "ball" }, clock, point, 30),
      ) &&
      throwsError(() =>
        throwInRelease(
          { kind: "throwIn", prop: "ball", at: { x: 0, y: 100, z: 1 } },
          clock,
          point,
          30,
        ),
      ),
  );
}
