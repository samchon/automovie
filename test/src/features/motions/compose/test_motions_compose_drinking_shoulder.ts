import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanDrinkingArm,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  measureDrinkingShoulder
} from "../../../../../packages/motions/src/compose/internal/measureDrinkingShoulder";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of an arccosine, degrees. */
const ROUNDING: number = 1e-9;

/** The left shoulder, elbow and hip at the given places. */
function bones(
  elbow: IAutoMovieVector3,
): ReadonlyMap<AutoMovieHumanoidBone, { worldPosition: IAutoMovieVector3 }> {
  return new Map<AutoMovieHumanoidBone, { worldPosition: IAutoMovieVector3 }>([
    ["leftUpperArm", { worldPosition: { x: 0.2, y: 1.4, z: 0 } }],
    ["leftLowerArm", { worldPosition: elbow }],
    ["leftUpperLeg", { worldPosition: { x: 0.1, y: 0.9, z: 0 } }],
  ]);
}

/**
 * `measureDrinkingShoulder` is the shoulder's flexion and abduction as Alt
 * Murphy et al. 2006 measure the drinking task: the unsigned angle between the
 * shoulder-to-elbow and shoulder-to-hip vectors, both projected on the
 * heading's sagittal plane (forward and up) for the flexion and its frontal
 * plane (side and up) for the abduction.
 *
 * Scenarios, the left shoulder at (0.2, 1.4, 0) and hip at (0.1, 0.9, 0):
 *
 * 1. The elbow 0.3 m ahead of the shoulder, heading +Z: flexion 90 (the hip
 *    straight down in the sagittal plane), abduction the frontal angle between
 *    (0, 0) and (−0.1, −0.5), read as 0 for a vector with no frontal length.
 * 2. The elbow 0.3 m to the side (+X), heading +Z: flexion 0 against a hip
 *    straight down sagittally, abduction 90 + atan(0.1 / 0.5).
 * 3. With the heading turned 90 degrees (+X ahead, −Z to the side) the planes turn
 *    with it: the arm aside is now raised ahead at 90 + atan(0.1 / 0.5), and an
 *    elbow 0.3 m toward −Z is abducted 90.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names an arm ahead and aside, a vanishing projection and the changed sagittal and frontal planes under a quarter-turn heading.
 * @evidence contracts/development/testing.md#behavioral-verification Calls measureDrinkingShoulder using three authored landmarks and exact 0 or 90 degree headings, then checks flexion and abduction.
 * @evidence contracts/development/testing.md#independent-expectations Axis-aligned projections give 90 or 0 degrees. The hip offset of 0.1 m sideways and 0.5 m down contributes atan(0.1/0.5) where it lies in the measured plane.
 */
export function test_motions_compose_drinking_shoulder(): void {
  const ahead: IAutoMovieMotionHumanDrinkingArm.IMeasuredResult =
    measureDrinkingShoulder(bones({ x: 0.2, y: 1.4, z: 0.3 }), "left", 0);
  const aside: IAutoMovieMotionHumanDrinkingArm.IMeasuredResult =
    measureDrinkingShoulder(bones({ x: 0.5, y: 1.4, z: 0 }), "left", 0);
  const turned: IAutoMovieMotionHumanDrinkingArm.IMeasuredResult =
    measureDrinkingShoulder(bones({ x: 0.5, y: 1.4, z: 0 }), "left", 90);
  const behind: IAutoMovieMotionHumanDrinkingArm.IMeasuredResult =
    measureDrinkingShoulder(bones({ x: 0.2, y: 1.4, z: -0.3 }), "left", 90);
  const tilt: number = (Math.atan(0.1 / 0.5) * 180) / Math.PI;

  // 1. Ahead.
  TestValidator.predicate(
    "an arm raised ahead",
    nclose(ahead.flexion, 90, ROUNDING) && ahead.abduction === 0,
  );

  // 2. Aside.
  TestValidator.predicate(
    "an arm raised aside",
    aside.flexion === 0 && nclose(aside.abduction, 90 + tilt, ROUNDING),
  );

  // 3. The heading.
  TestValidator.predicate(
    "the heading's planes",
    nclose(turned.flexion, 90 + tilt, ROUNDING) &&
      nclose(behind.abduction, 90, ROUNDING),
  );
}
