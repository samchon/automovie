import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionManner,
} from "@automovie/interface";
import {
  motionManner
} from "../../../../../packages/motions/src/compose/internal/motionManner";
import {
  flinch
} from "../../../../../packages/motions/src/reaction/internal/flinch";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Check the effect of tempo on the reflex flinch clock.
 *
 * Scenarios:
 *
 * 1. Compare neutral with tempo 2. Both start the stroke at entry and reach
 *    the same positive stroke second.
 * 2. The time from stroke to end doubles at tempo 2.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios distinguish stroke timing from the scaled return.
 * @evidence contracts/development/testing.md#behavioral-verification The test distinguishes the fixed reflex rise from the tempo-scaled return.
 * @evidence contracts/development/testing.md#independent-expectations The neutral clock is the reference for the unchanged stroke and elapsed return, and the input tempo sets the independent factor of two.
 */
export function test_motions_reaction_flinch(): void {
  const slow: IAutoMovieMotionManner.IModifiers = {
    ...motionManner.NEUTRAL,
    tempo: 2,
  };
  const neutral: IAutoMovieMotionClock = flinch.timetable(
    motionManner.NEUTRAL,
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
