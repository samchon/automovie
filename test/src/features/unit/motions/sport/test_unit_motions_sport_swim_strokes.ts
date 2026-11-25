import type { IAutoMovieMotionClock } from "@automovie/interface";
import { swim } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The `swim` law's stroke cues (`swim.strokes`): a crawl enters the right arm
 * each period, the left arm the lag later, and breathes midway through the
 * recovery after the 0.6 pull; a tread cycles each period.
 *
 * Scenarios:
 *
 * 1. Two crawl cycles of 1.4 s with a 0.3 lag: the right enters again at 1.4 s,
 *    the left first at 0.42 s, the first breath at 0.8 · 1.4 = 1.12 s, relaxed
 *    at 2.8 s.
 * 2. Three tread cycles of 1 s: the third at 2 s, ending at 3 s.
 */
export function test_unit_motions_sport_swim_strokes(): void {
  const crawl: IAutoMovieMotionClock = swim.strokes(true, 2, 1.4, 0.3);
  TestValidator.predicate(
    "the crawl",
    swim.PULL === 0.6 &&
      nclose(crawl.at("entryRight2"), 1.4, 1e-12) &&
      nclose(crawl.at("entryLeft1"), 0.42, 1e-12) &&
      nclose(crawl.at("breath1"), 1.12, 1e-12) &&
      nclose(crawl.at("relax"), 2.8, 1e-12),
  );
  const tread: IAutoMovieMotionClock = swim.strokes(false, 3, 1, 0);
  TestValidator.predicate(
    "the tread",
    nclose(tread.at("cycle3"), 2, 1e-12) && nclose(tread.duration, 3, 1e-12),
  );
}
