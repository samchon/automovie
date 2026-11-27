import {
  HumanBikeGuidePath
} from "../../../../../packages/motions/src/lexicon/internal/HumanBikeGuidePath";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanBikeGuidePath.stops` finds where the athlete beside a wheeled bicycle
 * comes to a stop: the start of each pause at least a swing long, and the
 * path's end.
 *
 * The root moves 1 m by 1 s, pauses from 1 s to 2 s, moves on to 2 m by 3 s,
 * pauses again for 0.2 s, and ends at 2.5 m.
 *
 * Scenarios:
 *
 * 1. The long pause at 1 m stops the athlete; the short pause at 2 m, shorter than
 *    a swing (`SWING`), does not; the path's end does.
 */
export function test_motions_lexicon_bike_guide_stops(): void {
  TestValidator.equals(
    "a stop at the long pause and the end",
    HumanBikeGuidePath.stops({
      times: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.1, 3.2, 3.6],
      distances: [0, 0.5, 1, 1, 1, 1.5, 2, 2, 2, 2.5],
    }),
    [1, 2.5],
  );
}
