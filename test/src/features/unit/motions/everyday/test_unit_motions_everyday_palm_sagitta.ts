import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { palmSagitta } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** Rounding of one square and quotient, metres. */
const ROUNDING: number = 1e-15;

/**
 * `palmSagitta` lifts a flat palm along a thigh by the sagitta of half its
 * breadth on the thigh's radius, `h^2 / (2 r)`, the breadth `PALM_BREADTH`
 * (0.45) of the hand's length.
 *
 * Scenarios:
 *
 * 1. For the average man the lift is `(0.45 hand / 2)^2 / (2 thighRadius)`.
 * 2. The palm's half breadth lies within the thigh's radius, so the lift is under
 *    half of it: h < r gives h^2 / (2 r) < h / 2.
 */
export async function test_unit_motions_everyday_palm_sagitta(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const half: number = (0.45 * body.measure.hand) / 2;
  const lift: number = palmSagitta(body);
  TestValidator.predicate(
    "the sagitta of half the palm",
    nclose(lift, (half * half) / (2 * body.measure.thighRadius), ROUNDING),
  );
  TestValidator.predicate(
    `under half the half breadth (${lift} m)`,
    half < body.measure.thighRadius && lift > 0 && lift < half / 2,
  );
}
