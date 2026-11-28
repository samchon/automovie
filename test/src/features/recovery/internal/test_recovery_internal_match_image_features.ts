import { AutoMovieRecoveryTrackLineage } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `matchRecoveryImageFeatures` keeps the mutual nearest descriptor pairs whose
 * distance is under ratio times the second nearest.
 *
 * Scenarios:
 *
 * 1. Two features with unit descriptors on channel 0 and 1 against the same two in
 *    the other image, swapped in order, match crosswise with squared distance 0
 *    and ratio 0, carrying their pixel points.
 * 2. Identical descriptors in the second image leave no unique nearest feature, so
 *    nothing matches.
 * 3. A pair count above the budget is refused.
 * 4. A singleton target needs no work. In the reverse direction, one descriptor
 *    against two uses both comparisons and preserves ranking.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names mutual correspondence, second-nearest ratio, exact ties and pair budget.
 * @evidence contracts/development/testing.md#behavioral-verification Matches swapped unit descriptors, exercises a tie, refuses an exhausted traversal, and compares both directions with one singleton population.
 * @evidence contracts/development/testing.md#independent-expectations Equal unit descriptors have distance zero and the other axis is the distinct positive-distance competitor. A single target has no runner-up. Two targets require exactly two comparisons for one source.
 */
export function test_recovery_internal_match_image_features(): void {
  const feature = (
    channel: number,
    x: number,
    y: number,
  ): Parameters<
    typeof AutoMovieRecoveryTrackLineage.matchImageFeatures
  >[0][number] => {
    const descriptor: Float64Array = new Float64Array(128);
    descriptor[channel] = 1;
    return {
      point: [x, y],
      scale: 1,
      orientationRadians: 0,
      response: 1,
      descriptor,
    };
  };
  const first = [feature(0, 10, 20), feature(1, 30, 40)];
  const second = [feature(1, 31, 41), feature(0, 11, 21)];
  const matches: ReturnType<
    typeof AutoMovieRecoveryTrackLineage.matchImageFeatures
  > = AutoMovieRecoveryTrackLineage.matchImageFeatures(first, second, 0.8, 100);
  TestValidator.equals("two matches", matches.length, 2);
  TestValidator.equals(
    "first crosses to second",
    [
      matches[0]!.firstIndex,
      matches[0]!.secondIndex,
      matches[1]!.firstIndex,
      matches[1]!.secondIndex,
    ],
    [0, 1, 1, 0],
  );
  TestValidator.equals("pixel points", matches[0]!.second, [11, 21]);
  TestValidator.predicate(
    "exact descriptors",
    nclose(matches[0]!.squaredDescriptorDistance, 0, 0) &&
      nclose(matches[0]!.descriptorDistanceRatio, 0, 0),
  );
  TestValidator.equals(
    "repeated descriptors match nothing",
    AutoMovieRecoveryTrackLineage.matchImageFeatures(
      first,
      [feature(0, 11, 21), feature(0, 12, 22)],
      0.8,
      100,
    ).length,
    0,
  );
  TestValidator.error("an exhausted pair budget", (): unknown =>
    AutoMovieRecoveryTrackLineage.matchImageFeatures(first, second, 0.8, 3),
  );
  TestValidator.equals(
    "singleton target uses no comparison budget",
    AutoMovieRecoveryTrackLineage.matchImageFeatures(
      first,
      first.slice(0, 1),
      0.8,
      0,
    ),
    [],
  );
  const oneDirection = AutoMovieRecoveryTrackLineage.matchImageFeatures(
    first.slice(0, 1),
    second,
    0.8,
    2,
  );
  TestValidator.equals(
    "one source and two targets retain the best ranked pair",
    oneDirection.map((match) => [match.firstIndex, match.secondIndex]),
    [[0, 1]],
  );
  TestValidator.error(
    "one source still needs both target distances",
    (): unknown =>
      AutoMovieRecoveryTrackLineage.matchImageFeatures(
        first.slice(0, 1),
        second,
        0.8,
        1,
      ),
  );
}
