import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  grappleArms
} from "../../../../../packages/motions/src/grappling/internal/grappleArms";
import {
  grappleFront
} from "../../../../../packages/motions/src/grappling/internal/grappleFront";
import {
  grappleStances
} from "../../../../../packages/motions/src/grappling/internal/grappleStances";
import {
  grappleSumo
} from "../../../../../packages/motions/src/grappling/internal/grappleSumo";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A body's heights, depth and head radius, metres. */
const MEASURE: Parameters<typeof grappleFront.chest>[0]["measure"] &
  Parameters<typeof grappleFront.head>[0]["measure"] = {
  hipHeight: 0.9,
  chestHeight: 1.3,
  chestDepth: 0.24,
  headHeight: 1.6,
  headRadius: 0.1,
};

/** A duration refusal of the arms' plan asking a least duration. */
const short = (minimum: number): AutoMovieMotionHumanRefusal =>
  new AutoMovieMotionHumanRefusal({
    kind: "parameter",
    axis: "duration",
    value: 4,
    feasible: { kind: "range", minimum, maximum: 10, unit: "s" },
    reason: "too short",
    fix: "lengthen it",
  });

/**
 * Check grapple selection, staging, front extent and rest adjustment.
 *
 * Scenarios:
 *
 * 1. Compare the right shoulder throw and single-leg grip records and compare
 *    shoulder throw and yori-kiri durations.
 * 2. Identify oshi-dashi as a sumo bout and read its crouch, meeting, finish
 *    and rest shares.
 * 3. Calculate front extent for a chest leaning 30 degrees and head leaning
 *    90. Scale a 0.6 s rest after release to 0.75 s and refuse a rest beyond
 *    the scene.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the exact bout, grip, phase and scene-length inputs.
 * @evidence contracts/development/testing.md#behavioral-verification The fixture exercises the grappling functions for authored choices, posed front and rest placed against a scene cut.
 * @evidence contracts/development/testing.md#independent-expectations Expected choices come from the fixed table. The front distances follow trigonometry and rest length is scaled by the requested time ratio.
 */
export function test_motions_grappling_grapple(): void {
  TestValidator.equals(
    "the grips and the lengths",
    [
      grappleStances.regions("seoiNage", "right"),
      grappleStances.regions("singleLeg", "right"),
      grappleStances.seconds("seoiNage"),
      grappleStances.seconds("yoriKiri"),
    ],
    [
      { left: "elbowRight", right: "neckLeft" },
      { right: "thighFrontLeft" },
      3.5,
      5,
    ],
  );
  TestValidator.equals(
    "the sumo bouts",
    [
      grappleSumo.is("oshiDashi"),
      grappleSumo.is("seoiNage"),
      grappleSumo.window(),
    ],
    [
      true,
      false,
      { reach: 0.22, take: 0.32, release: 0.82 - 0.04, rest: 0.92 },
    ],
  );
  TestValidator.predicate(
    "the leaning fronts",
    nclose(grappleFront.chest({ measure: MEASURE }, 30), 0.2 + 0.12, 1e-12) &&
      nclose(grappleFront.head({ measure: MEASURE }, 90), 0.6 + 0.1, 1e-12),
  );
  TestValidator.equals(
    "the stretched rest, or none",
    [
      grappleArms.stretched(short(5), 4, 3, 3.6),
      grappleArms.stretched(short(8), 4, 3, 3.6),
    ],
    [3 + (0.6 * 5) / 4, undefined],
  );
}
