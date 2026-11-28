import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  strikingReadBack
} from "../../../../../packages/motions/src/striking/internal/strikingReadBack";
import { TestValidator } from "@nestia/e2e";

/**
 * A striking read-back refusal (`strikingReadBack`): a hit that reads another
 * performer whose placement reads the hit back at the same instant is refused
 * on `sync`, naming the performer and the act when given.
 *
 * Scenario: the punch read back by Ann is a participant refusal on `sync` with
 * the punch as its value, Ann as the performer and the punch as the act.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies refusal when two performers' placement references form a same-time cycle.
 * @evidence contracts/development/testing.md#behavioral-verification Passes a scripted punch that reads a performer whose placement reads the attack back to the refusal helper.
 * @evidence contracts/development/testing.md#independent-expectations The typed cycle expects the sync field and keeps the actual performer and act identifiers in the structured refusal.
 */
export function test_motions_striking_read_back(): void {
  const refusal: AutoMovieMotionHumanRefusal = strikingReadBack("punch", "ann");
  TestValidator.predicate(
    "the refusal",
    refusal instanceof AutoMovieMotionHumanRefusal &&
      refusal.kind === "participant" &&
      refusal.axis === "sync" &&
      refusal.value === "punch" &&
      refusal.performer === "ann" &&
      refusal.act === "punch" &&
      refusal.feasible === null,
  );
}
