import { TestValidator } from "@nestia/e2e";

import { hasPlantingSpacingOracle } from "../internal/hasPlantingSpacingOracle";

/**
 * The independent sweep measures every potentially violating pair rather than
 * only adjacent sorted points or the production's nine neighboring grid cells.
 * Authored distances preserve exact equality and the ground-only spacing law.
 *
 * Scenarios:
 * 1. Empty, singleton and zero-spacing inputs admit; exact axial/diagonal
 *    distances at the minimum admit, and nearby positive/negative coordinates fail.
 * 2. A violating pair with a far-away intervening z-coordinate is still found.
 * 3. Sorting a caller's unsorted list cannot mutate its original order.
 */
export const test_planting_spacing_oracle = (): void => {
  const points = (input: readonly (readonly [number, number])[]) =>
    input.map(([x, z]) => ({ translation: { x, z } }));
  for (const [name, input, minimum, expected] of [
    ["empty", [], 1, true], ["single", [[0, 0]], 1, true],
    ["no rule", [[0, 0], [0, 0]], 0, true],
    ["axial equality", [[1, 0], [0, 0]], 1, true],
    ["diagonal equality", [[0, 0], [.6, .8]], 1, true],
    ["diagonal too close", [[0, 0], [.6, .7]], 1, false],
    ["negative frame", [[-2, 0], [-1.5, 0]], 1, false],
    ["same x too close", [[0, 0], [0, .9]], 1, false],
    ["same x equality", [[0, 0], [0, 1]], 1, true],
    ["nonadjacent violation", [[0, 0], [.3, 10], [.6, 0]], 1, false],
  ] as const) TestValidator.equals(name, hasPlantingSpacingOracle(points(input), minimum), expected);
  const unsorted = points([[2, 0], [-2, 0], [0, 0]]);
  TestValidator.equals("independent sweep admits the authored spacing", hasPlantingSpacingOracle(unsorted, 1), true);
  TestValidator.equals("caller point order survives", unsorted.map(point => point.translation.x), [2, -2, 0]);
};
