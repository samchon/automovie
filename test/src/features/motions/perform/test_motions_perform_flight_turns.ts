import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanFlightTurns,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanPerformanceFlightRotation,
  HumanPerformanceStagedFlightRotation,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Rounding of a few quaternion products and one slerp. */
const ROUNDING: number = 1e-9;

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A flight of one second from 1 s, its table a quarter second apart. */
const TIMES: readonly number[] = [1, 1.25, 1.5, 1.75, 2];

/** The world's axes. */
const Y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const Z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** A table whose centre rises 0.4 m and falls back, its unturned root given. */
function table(
  root: (t: number) => IAutoMovieQuaternion,
): HumanPerformanceFlightRotation.IRow[] {
  return TIMES.map(
    (t: number): HumanPerformanceFlightRotation.IRow => ({
      about: { x: 0, y: 1 + 1.6 * (t - 1) * (2 - t), z: 0 },
      root: root(t),
    }),
  );
}

/** The staged flight of some turns over a table. */
function staged(
  turns: IAutoMovieMotionHumanFlightTurns,
  rows: readonly HumanPerformanceFlightRotation.IRow[],
): (seconds: number) => IAutoMovieHumanPostureRotation {
  return HumanPerformanceStagedFlightRotation({
    start: 0,
    t0: 1,
    t1: 2,
    step: 0.25,
    times: TIMES,
    table: rows,
    turns,
    turnedLanding: false,
  });
}

/** Whether two rotations are the same, either sign. */
function same(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean {
  return (
    Math.abs(Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w) - 1) <
    ROUNDING
  );
}

/**
 * A flight's turn: `HumanPerformanceFlightRotation` reads, at a second since
 * the flight's start, the centre lerped across its table interval and the turn
 * the orientation gives over the unturned root slerped there, `orientation ·
 * root⁻¹`; `HumanPerformanceStagedFlightRotation` authors that orientation as
 * `root · F (Rx(360 s u) Ry(360 w u)) F⁻¹`, s somersaults and w twists
 * advancing linearly over the flight in the axes frame F, so the turn is the
 * authored one conjugated by the unturned root: expressed in the body's own
 * heading.
 *
 * A flight from 1 to 2 s whose centre rises 0.4 m.
 *
 * Scenarios:
 *
 * 1. The centre at 1.125 s is halfway between the table's first two rows, 1.15 m
 *    up, and with no turn authored the turn is none; a flight starting at 0.5 s
 *    reads the same at 0.625 s since its start.
 * 2. One somersault on a root heading 90 degrees about +Y: a quarter turn at 1.25
 *    s about the heading's turn of +X, −Z.
 * 3. One somersault in the frame turned 90 degrees about +Z: a quarter turn at
 *    1.25 s about that frame's +X, +Y.
 * 4. Two twists: a half turn about +Y at 1.25 s, none at the landing.
 * 5. A root turning from heading 0 to 90 degrees over the first interval: at 1.125
 *    s the unturned root is slerped to heading 45, and one somersault's eighth
 *    turn is about (√½, 0, −√½).
 */
export function test_motions_perform_flight_turns(): void {
  const still: HumanPerformanceFlightRotation.IRow[] = table(
    (): IAutoMovieQuaternion => IDENTITY,
  );

  // 1. The centre and the start.
  const plain = (start: number): IAutoMovieHumanPostureRotation =>
    HumanPerformanceFlightRotation({
      start,
      t0: 1,
      t1: 2,
      step: 0.25,
      times: TIMES,
      table: still,
      orientation: (
        _: number,
        root: IAutoMovieQuaternion,
      ): IAutoMovieQuaternion => root,
    })(1.125 - start);
  TestValidator.predicate(
    "the centre lerped and no turn",
    vclose(plain(0).about, { x: 0, y: 1.15, z: 0 }, ROUNDING) &&
      same(plain(0).turn, IDENTITY) &&
      vclose(plain(0.5).about, plain(0).about, ROUNDING),
  );

  // 2. A heading.
  const heading: IAutoMovieQuaternion = Quaternion.fromAxisAngle(Y, 90);
  TestValidator.predicate(
    "the somersault in the body's heading",
    same(
      staged(
        { kind: "turns", somersault: 1, twist: 0 },
        table((): IAutoMovieQuaternion => heading),
      )(1.25).turn,
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: -1 }, 90),
    ),
  );

  // 3. A frame.
  TestValidator.predicate(
    "the somersault in its frame",
    same(
      staged(
        {
          kind: "turns",
          somersault: 1,
          twist: 0,
          frame: Quaternion.fromAxisAngle(Z, 90),
        },
        still,
      )(1.25).turn,
      Quaternion.fromAxisAngle(Y, 90),
    ),
  );

  // 4. Twists.
  const twisted: (seconds: number) => IAutoMovieHumanPostureRotation = staged(
    { kind: "turns", somersault: 0, twist: 2 },
    still,
  );
  TestValidator.predicate(
    "two twists",
    same(twisted(1.25).turn, Quaternion.fromAxisAngle(Y, 180)) &&
      same(twisted(2).turn, IDENTITY),
  );

  // 5. A turning root.
  const turning: (seconds: number) => IAutoMovieHumanPostureRotation = staged(
    { kind: "turns", somersault: 1, twist: 0 },
    table(
      (t: number): IAutoMovieQuaternion =>
        t === 1 ? IDENTITY : Quaternion.fromAxisAngle(Y, 90),
    ),
  );
  TestValidator.predicate(
    "the turn about the slerped heading",
    same(
      turning(1.125).turn,
      Quaternion.fromAxisAngle({ x: Math.SQRT1_2, y: 0, z: -Math.SQRT1_2 }, 45),
    ),
  );
}
