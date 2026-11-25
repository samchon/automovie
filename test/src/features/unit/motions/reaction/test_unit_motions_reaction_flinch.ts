import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionManner,
} from "@automovie/interface";
import { AutoMovieMotionManner, flinch } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The `flinch` law's timetable (`flinch.timetable`): no preparation, the rise
 * to the `stroke` and the return, both stretched by the manner's tempo, the
 * stroke's start never moved.
 *
 * Scenario: twice as slow, the flinch starts at once, reaches its stroke at
 * twice the neutral time and ends at twice the neutral length.
 */
export function test_unit_motions_reaction_flinch(): void {
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
      nclose(late.at("stroke"), 2 * neutral.at("stroke"), 1e-12) &&
      nclose(late.duration, 2 * neutral.duration, 1e-12),
  );
}