import { humanHandrimStrokePhases } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * The `HumanHandrimStroke` law's phases (`humanHandrimStrokePhases`): the hand
 * approaches the rim, pushes it to the release and recovers.
 *
 * Scenarios:
 *
 * 1. A 0.2 s approach, 0.5 s push and 0.3 s recovery release at 0.7 s of a 1 s
 *    stroke, cued `catch` at 0.2 and `release` at 0.7.
 * 2. A push of no length is refused.
 */
export function test_unit_motions_lexicon_handrim_stroke(): void {
  const phases: humanHandrimStrokePhases.IPhases = humanHandrimStrokePhases({
    approach: 0.2,
    push: 0.5,
    recovery: 0.3,
  });
  TestValidator.predicate(
    "the stroke's phases",
    nclose(phases.release, 0.7, 1e-12) &&
      nclose(phases.duration, 1, 1e-12) &&
      nclose(phases.events[0]!.share, 0.2, 1e-12) &&
      nclose(phases.events[1]!.share, 0.7, 1e-12),
  );
  TestValidator.predicate(
    "no push",
    throwsError(() =>
      humanHandrimStrokePhases({ approach: 0.2, push: 0, recovery: 0.3 }),
    ),
  );
}