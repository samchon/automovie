import { abductionRange } from "@automovie/engine";
import type { IAutoMovieJointConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one interpolation. */
const ROUNDING: number = 1e-12;

/** Abduction -10..20, widening to 60 at 90 degrees of flexion. */
const FLEXED: IAutoMovieJointConstraint = {
  flexion: null,
  abduction: { min: -10, max: 20 },
  abductionFlexed: { flexion: 90, max: 60 },
  twist: null,
};

/**
 * `abductionRange` widens the upper abduction bound linearly with flexion, by
 * `share = clamp(flexion / flexed.flexion, 0, 1)`.
 *
 * Scenarios:
 *
 * 1. Flexion 45 gives share 1/2 and a maximum of 20 + 40 * 1/2 = 40.
 * 2. Flexion 200 clamps the share to 1, giving 60.
 * 3. A null or zero flexion keeps the plain range.
 * 4. No abduction range gives null, and no flexed rule gives the plain range.
 */
export function test_engine_rom_abduction_range(): void {
  TestValidator.predicate(
    "half share",
    nclose(abductionRange(FLEXED, 45)!.max, 40, ROUNDING) &&
      abductionRange(FLEXED, 45)!.min === -10,
  );
  TestValidator.equals("a clamped share", abductionRange(FLEXED, 200)!.max, 60);
  TestValidator.equals(
    "no flexion",
    [abductionRange(FLEXED, null), abductionRange(FLEXED, 0)],
    [
      { min: -10, max: 20 },
      { min: -10, max: 20 },
    ],
  );
  TestValidator.predicate(
    "no range or no rule",
    abductionRange({ ...FLEXED, abduction: null }, 45) === null &&
      abductionRange({ ...FLEXED, abductionFlexed: null }, 45)!.max === 20,
  );
}
