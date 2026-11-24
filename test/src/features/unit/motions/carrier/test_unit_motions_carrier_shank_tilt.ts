import type { IAutoMovieVector3 } from "@automovie/interface";
import { shankTilt } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few trigonometric evaluations, degrees. */
const ROUNDING: number = 1e-9;

/**
 * A straight leg's rounding, degrees: cos near 1 turns a rounding e of its
 * argument into sqrt(2 e) radians, about 1e-6 degrees at double precision.
 */
const STRAIGHT: number = 1e-5;

/** The thigh's length, metres. */
const THIGH: number = 0.45;

/** The shank's length, metres. */
const SHANK: number = 0.42;

/**
 * `shankTilt` is the shank's forward lean from vertical for an ankle below a
 * hip, the knee bent forward in the facing's plane: the two-link leg's closed
 * form. For an ankle straight below the hip at a distance `D`, the shank's lean
 * is the triangle's angle at the ankle, `acos((s^2 + D^2 - t^2) / (2 s D))` by
 * the law of cosines, with `t` the thigh and `s` the shank.
 *
 * Scenarios, for a 0.45 m thigh and a 0.42 m shank:
 *
 * 1. A straight leg under its hip leans 0 degrees.
 * 2. An ankle straight below at 90 % of the leg's length leans the law of cosines'
 *    angle forward.
 * 3. Facing the other way mirrors the knee: the same ankle leans the same, the
 *    knee now ahead of the reversed facing.
 */
export function test_unit_motions_carrier_shank_tilt(): void {
  const leg: shankTilt.ILeg = { measure: { thigh: THIGH, shank: SHANK } };
  const t: number = THIGH;
  const s: number = SHANK;
  const hip: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  // 1. Straight.
  TestValidator.predicate(
    "a straight leg",
    nclose(
      shankTilt(leg, hip, { x: 0, y: 1 - t - s, z: 0 }, { x: 0, y: 0, z: 1 }),
      0,
      STRAIGHT,
    ),
  );

  // 2. Bent under the hip.
  const D: number = 0.9 * (t + s);
  const expected: number =
    (Math.acos((s * s + D * D - t * t) / (2 * s * D)) * 180) / Math.PI;
  const ankle: IAutoMovieVector3 = { x: 0, y: 1 - D, z: 0 };
  TestValidator.predicate(
    "the law of cosines' lean",
    nclose(
      shankTilt(leg, hip, ankle, { x: 0, y: 0, z: 1 }),
      expected,
      ROUNDING,
    ),
  );

  // 3. Facing back.
  TestValidator.predicate(
    "the reversed facing",
    nclose(
      shankTilt(leg, hip, ankle, { x: 0, y: 0, z: -1 }),
      expected,
      ROUNDING,
    ),
  );
}
