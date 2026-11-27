import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  PrecisionStrokeForms
} from "../../../../../packages/motions/src/lexicon/internal/PrecisionStrokeForms";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `createPrecisionSportStroke` law's phrase (`PrecisionStrokeForms.clock`):
 * the preparation, the attack to the contact, the follow-through and the return
 * as shares of the time from the stroke's start to its contact, 0.64, 0.36,
 * 0.36 and 0.5 of it.
 *
 * Scenario: a stroke contacting 1.5 s after its start is ready at 0.96 s,
 * contacts at 1.5 s (`stroke`), follows through to 2.04 s and returns by 2.79
 * s.
 */
export function test_motions_lexicon_precision_sport_stroke(): void {
  const clock: IAutoMovieMotionClock = PrecisionStrokeForms.clock(1.5);
  TestValidator.predicate(
    "the stroke's phrase",
    nclose(clock.at("ready"), 0.96, 1e-12) &&
      nclose(clock.at("stroke"), 1.5, 1e-12) &&
      nclose(clock.at("strokeEnd"), 2.04, 1e-12) &&
      nclose(clock.duration, 2.79, 1e-12),
  );
}
