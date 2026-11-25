import { disarm } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * The `disarm` law's lever (`disarm.leverTime`): 0.5 s by default, and
 * positive.
 *
 * Scenario: nothing asked levers 0.5 s, 0.8 asked levers 0.8 s, and none is
 * refused.
 */
export function test_unit_motions_grappling_disarm(): void {
  TestValidator.equals(
    "the lever",
    [disarm.leverTime(undefined), disarm.leverTime(0.8)],
    [0.5, 0.8],
  );
  TestValidator.predicate(
    "no lever",
    throwsError(() => disarm.leverTime(0)),
  );
}
