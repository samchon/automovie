import { AutoMovieEngineKinematics } from "@automovie/engine";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names intermediate and saturated flexion, absent flexion, and missing range and flexed controls.
 * @evidence contracts/development/testing.md#behavioral-verification Calls Kinematics.abductionRange on typed ROM records at fixed flexion values, then inspects both interval bounds and absence.
 * @evidence contracts/development/testing.md#independent-expectations Flexion 45 is half of the authored 90-degree target, so the upper limit grows from 20 to 40 and the lower stays -10. Flexion 200 saturates at the authored upper limit 60.
 */
export function test_engine_rom_abduction_range(): void {
  TestValidator.predicate(
    "half share",
    nclose(AutoMovieEngineKinematics.abductionRange(FLEXED, 45)!.max, 40, ROUNDING) &&
      AutoMovieEngineKinematics.abductionRange(FLEXED, 45)!.min === -10,
  );
  TestValidator.equals("a clamped share", AutoMovieEngineKinematics.abductionRange(FLEXED, 200)!.max, 60);
  TestValidator.equals(
    "no flexion",
    [AutoMovieEngineKinematics.abductionRange(FLEXED, null), AutoMovieEngineKinematics.abductionRange(FLEXED, 0)],
    [
      { min: -10, max: 20 },
      { min: -10, max: 20 },
    ],
  );
  TestValidator.predicate(
    "no range or no rule",
    AutoMovieEngineKinematics.abductionRange({ ...FLEXED, abduction: null }, 45) === null &&
      AutoMovieEngineKinematics.abductionRange({ ...FLEXED, abductionFlexed: null }, 45)!.max === 20,
  );
}
