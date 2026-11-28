import {
  balletStep
} from "../../../../../packages/motions/src/exercise/internal/balletStep";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * The `balletStep` law's admission (`balletStep.admit`): a turnout within the
 * hips' external rotation, 35 degrees by default, one of the five positions of
 * the feet, rounded, and one or two turns.
 *
 * Scenarios:
 *
 * 1. Nothing asked, within 90 degrees of rotation, is a 35 degree turnout in first
 *    position with one turn; 40 degrees, position 2.4 and two turns are
 *    admitted as 40, 2 and 2 within 50.
 * 2. A turnout of 60 within 50, a negative one, a sixth position and three turns
 *    are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Ballet admission defaults to first position and refuses turnout and turns beyond the declared ranges.
 * @evidence contracts/development/testing.md#behavioral-verification Calls ballet admission with no overrides, a fractional position, and separate invalid turnout, position, and turn values.
 * @evidence contracts/development/testing.md#independent-expectations The 35-degree default, rounded positions and one-or-two-turn limit determine the exact admitted and refused inputs independently of pose generation.
 */
export function test_motions_exercise_ballet_step(): void {
  TestValidator.equals("the defaults", balletStep.admit({}, 90), {
    turnout: 35,
    position: 1,
    turns: 1,
  });
  TestValidator.equals(
    "asked",
    balletStep.admit({ turnout: 40, position: 2.4, turns: 2 }, 50),
    { turnout: 40, position: 2, turns: 2 },
  );
  TestValidator.predicate(
    "out of range",
    throwsError(() => balletStep.admit({ turnout: 60 }, 50)) &&
      throwsError(() => balletStep.admit({ turnout: -1 }, 50)) &&
      throwsError(() => balletStep.admit({ position: 6 }, 50)) &&
      throwsError(() => balletStep.admit({ turns: 3 }, 50)),
  );
}
