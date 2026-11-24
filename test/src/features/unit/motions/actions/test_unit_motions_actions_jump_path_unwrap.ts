import { jumpPath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one wrap of whole turns, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `jumpPath.unwrap` gives the equivalent of a heading within half a turn of
 * another, so a turn between them takes the shorter way.
 *
 * Scenarios:
 *
 * 1. 10 degrees near 350 is 370.
 * 2. 350 degrees near 10 is -10.
 * 3. A heading already near is unchanged: 30 near 20 is 30.
 * 4. Whole turns away are taken off: 725 near 0 is 5.
 */
export function test_unit_motions_actions_jump_path_unwrap(): void {
  TestValidator.predicate(
    "forward through 360",
    nclose(jumpPath.unwrap(10, 350), 370, ROUNDING),
  );
  TestValidator.predicate(
    "back through 0",
    nclose(jumpPath.unwrap(350, 10), -10, ROUNDING),
  );
  TestValidator.predicate(
    "already near",
    nclose(jumpPath.unwrap(30, 20), 30, ROUNDING),
  );
  TestValidator.predicate(
    "whole turns away",
    nclose(jumpPath.unwrap(725, 0), 5, ROUNDING),
  );
}
