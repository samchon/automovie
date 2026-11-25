import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  HumanPerformanceFlightRotation,
  HumanPerformanceStagedFlightRotation,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A flight of one second from 1 s, its table a quarter second apart. */
const TIMES: readonly number[] = [1, 1.25, 1.5, 1.75, 2];

/** The centre rising 0.4 m and falling back, the unturned root still. */
const TABLE: readonly HumanPerformanceFlightRotation.IRow[] = TIMES.map(
  (t: number): HumanPerformanceFlightRotation.IRow => ({
    about: { x: 0, y: 1 + 1.6 * (t - 1) * (2 - t), z: 0 },
    root: IDENTITY,
  }),
);

/** Whether two rotations are the same, either sign. */
const same = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean =>
  Math.abs(Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w) - 1) < 1e-9;

/**
 * A flight pass: `HumanPerformanceFlightRotation` turns the body about its
 * composed centre by the flight's orientation over its unturned root, and
 * `HumanPerformanceStagedFlightRotation` authors that orientation as whole
 * somersaults advancing linearly over the flight.
 *
 * A flight from 1 to 2 s whose centre peaks 0.4 m up at 1.5 s, the unturned
 * root still.
 *
 * Scenarios:
 *
 * 1. One somersault is half done at the apex: the body inverted, half a turn about
 *    +X, about the centre at its peak; a quarter turn at 1.25 s.
 * 2. It closes at the landing onto no turn, and reads held before and after the
 *    flight.
 * 3. A fractional somersault that does not close onto the landing is refused.
 */
export function test_motions_perform_flight_rotation(): void {
  const flight: (seconds: number) => IAutoMovieHumanPostureRotation =
    HumanPerformanceStagedFlightRotation({
      start: 0,
      t0: 1,
      t1: 2,
      step: 0.25,
      times: TIMES,
      table: TABLE,
      turns: { kind: "turns", somersault: 1, twist: 0 },
      turnedLanding: false,
    });
  const apex: IAutoMovieHumanPostureRotation = flight(1.5);
  TestValidator.predicate(
    "inverted at the apex",
    same(apex.turn, Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 180)) &&
      vclose(apex.about, { x: 0, y: 1.4, z: 0 }, 1e-12) &&
      same(
        flight(1.25).turn,
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      ),
  );
  TestValidator.predicate(
    "closed at the landing",
    same(flight(2).turn, IDENTITY) &&
      same(flight(0.5).turn, IDENTITY) &&
      same(flight(3).turn, IDENTITY) &&
      nclose(flight(3).about.y, 1, 1e-12),
  );
  TestValidator.error("a half somersault", () =>
    HumanPerformanceStagedFlightRotation({
      start: 0,
      t0: 1,
      t1: 2,
      step: 0.25,
      times: TIMES,
      table: TABLE,
      turns: { kind: "turns", somersault: 0.5, twist: 0 },
      turnedLanding: false,
    }),
  );
}
