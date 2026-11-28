import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  shankTilt
} from "../../../../../packages/motions/src/carrier/internal/shankTilt";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

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
 * Check the sagittal shank tilt for a two-link leg.
 *
 * Scenarios:
 *
 * 1. A 0.45 m thigh and a 0.42 m shank extended below the hip give zero lean.
 * 2. Shorten the hip-to-ankle separation to 90 percent of full length and
 *    compare the resulting lean with the leg triangle.
 * 3. Reverse the facing. The knee bends ahead of the new direction at the
 *    same angle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give the segment lengths, bent separation and change of facing.
 * @evidence contracts/development/testing.md#behavioral-verification The solver covers straight and bent knees and a reversed forward direction.
 * @evidence contracts/development/testing.md#independent-expectations The expectation uses the law of cosines at the ankle and the specified two link lengths.
 */
export function test_motions_carrier_shank_tilt(): void {
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
