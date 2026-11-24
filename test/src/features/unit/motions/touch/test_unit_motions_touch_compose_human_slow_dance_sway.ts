import type { IAutoMovieComposition, IAutoMovieIntent } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import {
  HumanRefusal,
  composeHumanSlowDanceSway,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `composeHumanSlowDanceSway` stages a slow dance's sway as weight shifts:
 * over the left foot and back, then the right and back, `count` times, each
 * shift `by` metres taking half a beat out and half back; a count below one is
 * refused.
 *
 * Scenarios, on a chain for subject `a`:
 *
 * 1. Two sways of 0.04 m to a 1 s beat append four shifts, by 0.04, -0.04,
 *    0.04 and -0.04, each 0.5 s out and 0.5 s back.
 * 2. A count of 0 is refused on `count`.
 */
export function test_unit_motions_touch_compose_human_slow_dance_sway(): void {
  const intents = (node: IAutoMovieComposition): IAutoMovieIntent[] => {
    if (node.kind === "intent") return [node.intent];
    if (node.kind === "sequence" || node.kind === "parallel")
      return node.parts.flatMap(intents);
    return [];
  };
  TestValidator.equals(
    "two sways",
    intents(
      composeHumanSlowDanceSway(HumanChain.subject("a"), {
        by: 0.04,
        beat: 1,
        count: 2,
      }).node,
    ).map((intent: IAutoMovieIntent) => intent.parameters?.params),
    [0.04, -0.04, 0.04, -0.04].map((by: number) => ({
      by,
      duration: 0.5,
      returnSeconds: 0.5,
    })),
  );
  let refused: boolean = false;
  try {
    composeHumanSlowDanceSway(HumanChain.subject("a"), {
      by: 0.04,
      beat: 1,
      count: 0,
    });
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "count";
  }
  TestValidator.predicate("no sway", refused);
}
