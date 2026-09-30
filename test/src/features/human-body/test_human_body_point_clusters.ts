import { clusterHumanBodyPoints } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * Points closer than the gap share a group, chains of them are one group, and
 * distant points stand alone.
 *
 * Points are binned into cubes of side `gap` = 0.1 and joined across
 * neighbouring cubes, so the expected groups are counted by hand from the
 * coordinates.
 *
 * Scenarios:
 * 1. Three points 0.09 apart along x (cubes 0, 0 and 1) are one chain,
 *    although the first and last are 0.18 apart; a pair 0.05 apart in the
 *    same cube are one group; a far point stands alone; a pair that is
 *    diagonal across a cube corner, 0.035 apart, is one group.
 * 2. No points give no group, and one point gives itself.
 */
export const test_human_body_point_clusters = (): void => {
  const points = [
    [0, 0, 0],
    [0.09, 0, 0],
    [0.18, 0, 0],
    [1, 1, 1],
    [1.05, 1, 1],
    [5, 5, 5],
    [2.09, 2.09, 2.09],
    [2.11, 2.11, 2.11],
  ].flat();
  TestValidator.equals("chains, pairs, a loner and a diagonal pair", clusterHumanBodyPoints(points, 0.1), [
    [0, 1, 2],
    [3, 4],
    [5],
    [6, 7],
  ]);
  TestValidator.equals("no points, no groups", clusterHumanBodyPoints([], 0.1), []);
  TestValidator.equals("one point is its own group", clusterHumanBodyPoints([1, 2, 3], 0.1), [[0]]);
};
