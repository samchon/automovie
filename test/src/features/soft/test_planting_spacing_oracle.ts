import { TestValidator } from "@nestia/e2e";

import { hasPlantingSpacingOracle } from "../internal/hasPlantingSpacingOracle";
import { nclose } from "../internal/predicates";

/**
 * The independent sweep measures every potentially violating pair rather than
 * only adjacent sorted points or the production's nine neighboring grid cells.
 * Authored distances preserve exact equality and the ground-only spacing law.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the independent spacing predicate on authored pairs and an unsorted list; expected admissions, refusals and preserved order expose missed nonadjacent pairs or caller mutation.
 * @evidence contracts/testing.md#independent-expectations Axial distances and the 0.6/0.8 unit triangle supply hand-computed boundaries; expected booleans do not use production placement output, and preserved coordinates use zero-tolerance nclose.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty/singleton/disabled spacing, exact and below-limit axial/diagonal distances, negative coordinates, a nonadjacent violating pair and input order; finite coordinates and nonnegative spacing remain helper premises.
 * @evidence contracts/testing.md#execution-ownership This named discoverable portable unit test owns the table locally without dynamic registration or a browser/GPU; it tests the oracle supporting cluster tests rather than running production arrangement itself.
 *
 * Scenarios:
 * 1. Empty, singleton and zero-spacing inputs admit; exact axial/diagonal
 *    distances at the minimum admit, and nearby positive/negative coordinates fail.
 * 2. A violating pair with a far-away intervening z-coordinate is still found.
 * 3. Sorting a caller's unsorted list cannot mutate its original order.
 */
export function test_planting_spacing_oracle(): void {
  const points: (input: readonly (readonly [number, number])[]) => { translation: { x: number; z: number } }[] = (input: readonly (readonly [number, number])[]): { translation: { x: number; z: number } }[] =>
    input.map(([x, z]: readonly [number, number]): { translation: { x: number; z: number } } => ({ translation: { x, z } }));
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
  const unsorted: { translation: { x: number; z: number } }[] = points([[2, 0], [-2, 0], [0, 0]]);
  TestValidator.equals("independent sweep admits the authored spacing", hasPlantingSpacingOracle(unsorted, 1), true);
  TestValidator.predicate("caller point order survives", unsorted.length === 3 && unsorted.every((point: { translation: { x: number; z: number } }, index: number): boolean => nclose(point.translation.x, [2, -2, 0][index], 0)));
}
