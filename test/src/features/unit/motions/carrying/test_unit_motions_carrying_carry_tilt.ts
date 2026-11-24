import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { carry, loadedWalkPace } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few trigonometric products, degrees and shares. */
const ROUNDING: number = 1e-9;

/**
 * A carry's closed forms: `carry.tilt` leans the head, arms and trunk by
 * `asin(s d / (0.678 h))` (Winter's 67.8 % head-arms-trunk mass, its centre
 * 62.6 % of the way from the hips to the shoulders) for a load of mass share
 * `s` held `d` off the hips' midline, a pushed handle by 40 degrees a share;
 * `carry.hang` abducts a loaded straight arm just enough that its wrist clears
 * the thigh; `loadedWalkPace` slows the walk linearly from a fifth of the
 * body's mass to two fifths (4.75 to 4.6 km/h, Middleton et al. 2022).
 *
 * Scenarios, shoulders 0.2 m and hips 0.09 m in half width, a 0.3 m upper arm
 * and a 0.27 m forearm, shoulders 1.45 m and hips 0.9 m up, a 0.08 m thigh and
 * a 0.04 m forearm in radius:
 *
 * 1. A tenth of the mass in one hand leans `asin(0.1 x 0.2 / (0.678 x 0.626 x
 *    0.55))`; on the hip, with 0.09 m; held ahead in both hands, a third of the
 *    arm, 0.19 m; pushed, 4 degrees.
 * 2. The hanging arm is abducted `asin(0.01 / 0.57)`, its elbow straight at its
 *    range's least flexion; shoulders 0.3 m wide hang it plumb.
 * 3. The walk keeps its pace up to a fifth of the mass, is half way down at three
 *    tenths, and holds 4.6 / 4.75 from two fifths on.
 */
export function test_unit_motions_carrying_carry_tilt(): void {
  const measure: Pick<
    IAutoMovieMotionHumanBody["measure"],
    | "shoulderHalfWidth"
    | "hipHalfWidth"
    | "upperArm"
    | "forearm"
    | "shoulderHeight"
    | "hipHeight"
    | "thighRadius"
    | "forearmRadius"
  > = {
    shoulderHalfWidth: 0.2,
    hipHalfWidth: 0.09,
    upperArm: 0.3,
    forearm: 0.27,
    shoulderHeight: 1.45,
    hipHeight: 0.9,
    thighRadius: 0.08,
    forearmRadius: 0.04,
  };
  const body: { measure: typeof measure } = { measure };
  const lean: (offset: number) => number = (offset: number): number =>
    (Math.asin((0.1 * offset) / (0.678 * 0.626 * 0.55)) * 180) / Math.PI;
  TestValidator.predicate(
    "the lean",
    nclose(carry.tilt(body, "oneHand", 0.1), lean(0.2), ROUNDING) &&
      nclose(carry.tilt(body, "hip", 0.1), lean(0.09), ROUNDING) &&
      nclose(carry.tilt(body, "twoHands", 0.1), lean(0.19), ROUNDING) &&
      nclose(carry.tilt(body, "push", 0.1), 4, ROUNDING),
  );
  const hung: ReturnType<typeof carry.hang> = carry.hang(body, "right");
  TestValidator.predicate(
    "the hanging arm",
    nclose(hung.upper[1], (Math.asin(0.01 / 0.57) * 180) / Math.PI, ROUNDING) &&
      hung.lower[0] === DEFAULT_HUMANOID_ROM.rightLowerArm!.flexion!.min &&
      carry.hang({ measure: { ...measure, shoulderHalfWidth: 0.3 } }, "left")
        .upper[1] === 0,
  );
  TestValidator.predicate(
    "the pace",
    loadedWalkPace(0) === 1 &&
      loadedWalkPace(0.2) === 1 &&
      nclose(loadedWalkPace(0.3), 1 + 0.5 * (4.6 / 4.75 - 1), ROUNDING) &&
      nclose(loadedWalkPace(0.5), 4.6 / 4.75, ROUNDING),
  );
}
