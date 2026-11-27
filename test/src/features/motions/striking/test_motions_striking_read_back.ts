import { AutoMovieMotionHumanRefusal, strikingReadBack } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * A striking read-back refusal (`strikingReadBack`): a hit that reads another
 * performer whose placement reads the hit back at the same instant is refused
 * on `sync`, naming the performer and the act when given.
 *
 * Scenario: the punch read back by Ann is a participant refusal on `sync` with
 * the punch as its value, Ann as the performer and the punch as the act.
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
