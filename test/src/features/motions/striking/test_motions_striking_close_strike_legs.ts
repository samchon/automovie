import {
  CloseStrikeLegs
} from "../../../../../packages/motions/src/striking/internal/CloseStrikeLegs";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A spinning close strike's feet (`CloseStrikeLegs.round`): carried a whole
 * turn on a minimum-jerk share between 0.2 and 0.8 of the spin, signed with it,
 * the spin read up to one turn.
 *
 * Scenario: no spin carries nothing; a tenth of a turn, before the share
 * starts, nothing; half a turn half round, 180 degrees; a whole turn back the
 * whole way, -360 degrees, and a turn and a half no further.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the foot rig's signed minimum-jerk spin share and maximum turn.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the virtual foot rotation at zero, a tenth, a half, a full reverse turn and beyond one turn.
 * @evidence contracts/development/testing.md#independent-expectations Progress 0.1 precedes the blend, progress 0.5 gives 180 degrees, and the negative full turn clamps at -360 degrees.
 */
export function test_motions_striking_close_strike_legs(): void {
  TestValidator.predicate(
    "round",
    CloseStrikeLegs.ROUND[0] === 0.2 &&
      CloseStrikeLegs.ROUND[1] === 0.8 &&
      nclose(CloseStrikeLegs.round(0), 0, 1e-12) &&
      nclose(CloseStrikeLegs.round(36), 0, 1e-12) &&
      nclose(CloseStrikeLegs.round(180), 180, 1e-12) &&
      nclose(CloseStrikeLegs.round(-360), -360, 1e-12) &&
      nclose(CloseStrikeLegs.round(540), 360, 1e-12),
  );
}
