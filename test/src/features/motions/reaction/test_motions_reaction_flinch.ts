import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionManner,
} from "@automovie/interface";
import {
  AutoMovieMotionManner
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionManner";
import {
  flinch
} from "../../../../../packages/motions/src/reaction/internal/flinch";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `flinch` law's timetable (`flinch.timetable`): no preparation, the rise
 * to the `stroke` kept at its reflex length, and the return stretched by the
 * manner's tempo.
 *
 * Scenario: twice as slow, the flinch still strikes at its neutral time, and
 * its return after the stroke takes twice the neutral time.
 */
export function test_motions_reaction_flinch(): void {
  const slow: IAutoMovieMotionManner.IModifiers = {
    ...AutoMovieMotionManner.NEUTRAL,
    tempo: 2,
  };
  const neutral: IAutoMovieMotionClock = flinch.timetable(
    AutoMovieMotionManner.NEUTRAL,
  );
  const late: IAutoMovieMotionClock = flinch.timetable(slow);
  TestValidator.predicate(
    "the rise and the return",
    neutral.at("strokeStart") === 0 &&
      neutral.at("stroke") > 0 &&
      late.at("strokeStart") === 0 &&
      nclose(late.at("stroke"), neutral.at("stroke"), 1e-12) &&
      nclose(
        late.duration - late.at("stroke"),
        2 * (neutral.duration - neutral.at("stroke")),
        1e-12,
      ),
  );
}
