import { AutoMovieArchetypeQuadrupedGait as gait } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** The provided scale, interpolation and contact ratios are exactly dyadic. */
const EXACT_DYADIC_TOLERANCE: number = 0;

/**
 * The gait clock applies height similarity, duty fractions and lead rebasing.
 *
 * Scenarios:
 *
 * 1. Four times the reference height doubles the speed and stride scales. Speed
 *    eight brackets the reference rows at their midpoint, giving period two,
 *    spread one half, fore contact 5/8 and hind contact 7/8. Tempo changes
 *    period but preserves both duty fractions.
 * 2. An absolute clock keeps reference speed and time at the larger height.
 *    Out-of-domain speed, tempo and height each refuse.
 * 3. Changing the lead mirrors the limbs and restarts phase at left fore.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names height-scaled and absolute clocks, duty preservation, phase rebasing and unsupported speed, tempo and height.
 * @evidence contracts/development/testing.md#behavioral-verification Calls real clock and phase preparation with an authored gait table, comparing timing, step variability, contact phases and their lead-rebased counterparts.
 * @evidence contracts/development/testing.md#independent-expectations Four times the body height gives twice the square-root similarity factor. Interpolating the stated midpoint rows produces the literal timing and fractions, and a change of lead permutes the paired phase offsets.
 */
export function test_archetypes_internal_quadruped_gait_clock(): void {
  const source: gait.ClockSource = {
    archetype: "analytic gait",
    table: {
      order: ["canter"],
      reference: 1,
      hysteresis: 0,
      follow: { fore: 0, hind: 0 },
      gaits: {
        canter: {
          rows: [
            { speed: 2, stride: 1, deviation: 1 / 4, stance: 1 / 2 },
            {
              speed: 6,
              stride: 3,
              deviation: 3 / 4,
              stance: 3 / 4,
              hindStance: 5 / 4,
            },
          ],
          phases: {
            leftFore: 0,
            rightFore: 1 / 4,
            leftHind: 1 / 2,
            rightHind: 3 / 4,
          },
          bob: 0,
          nod: { range: 0, timing: "lead" },
          fold: { fore: 0, hind: 0 },
          lift: { fore: 0, hind: 0 },
        },
      },
    },
  };
  const similar: gait.ITiming = gait.timing(source, "canter", 8, 1 / 2, 4);
  const absolute: gait.ITiming = gait.timing(
    { ...source, table: { ...source.table, scaling: "absolute" } },
    "canter",
    4,
    1 / 2,
    4,
  );
  TestValidator.predicate(
    "similar clock scales time, but not the two duties",
    nclose(similar.stride, 9 / 2, EXACT_DYADIC_TOLERANCE) &&
      nclose(similar.deviation, 1, EXACT_DYADIC_TOLERANCE) &&
      nclose(similar.duty, 5 / 16, EXACT_DYADIC_TOLERANCE) &&
      similar.hindDuty !== undefined &&
      nclose(similar.hindDuty, 7 / 16, EXACT_DYADIC_TOLERANCE),
  );
  TestValidator.predicate(
    "absolute clock retains declared time and spread",
    nclose(absolute.stride, 9 / 4, EXACT_DYADIC_TOLERANCE) &&
      nclose(absolute.deviation, 1 / 2, EXACT_DYADIC_TOLERANCE),
  );
  TestValidator.error("speed below gait range", (): unknown =>
    gait.timing(source, "canter", 1),
  );
  TestValidator.error("tempo above the range", (): unknown =>
    gait.timing(source, "canter", 4, 2),
  );
  TestValidator.error("height must be positive", (): unknown =>
    gait.timing(source, "canter", 4, 0, 0),
  );

  const left: gait.IStride = { gait: "canter", lead: "left" };
  const right: gait.IStride = { gait: "canter", lead: "right" };
  TestValidator.predicate(
    "left lead uses the declared phase",
    nclose(
      gait.phase(source, left, "rightFore"),
      1 / 4,
      EXACT_DYADIC_TOLERANCE,
    ),
  );
  TestValidator.predicate(
    "right lead mirrors and rebases",
    nclose(gait.phase(source, right, "leftFore"), 0, EXACT_DYADIC_TOLERANCE) &&
      nclose(
        gait.phase(source, right, "rightFore"),
        3 / 4,
        EXACT_DYADIC_TOLERANCE,
      ) &&
      nclose(
        gait.phase(source, right, "leftHind"),
        1 / 2,
        EXACT_DYADIC_TOLERANCE,
      ) &&
      nclose(
        gait.phase(source, right, "rightHind"),
        1 / 4,
        EXACT_DYADIC_TOLERANCE,
      ),
  );
}
