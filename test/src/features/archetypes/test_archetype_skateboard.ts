import { ArchetypeUnits, createSkateboard } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A skateboard is Powell Peralta's deck at the narrow and wide end of its size, seven 1/16 in plies thick, on Independent's 55 mm trucks and Spitfire's 52 mm wheels.
 *
 * Scenarios:
 * 1. At size 0 the deck is 7.75 x 31.75 in with a 14 in wheelbase; at size 1 it is 8.5 x 33.5 in with 15 in.
 * 2. The deck is 7/16 in thick, its underside 55 mm over the axles and the axles a 52 mm wheel's radius up, so its `deck` lies at the sum.
 * 3. `nose` and `tail` lie on the deck's ends.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts at both ends of the size; a deck off its maker's sizes, or a deck floating off its trucks, is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are Powell Peralta's, Roarockit's, Independent's and Spitfire's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases Both ends of the size; both ends of the deck.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_skateboard(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  for (const [size, width, length, wheelbase] of [
    [0, 7.75, 31.75, 14],
    [1, 8.5, 33.5, 15],
  ] as const) {
    const board: ReturnType<typeof createSkateboard> = createSkateboard({ size });
    near(`board ${size}: width`, archetypeExtent(board, "x", ["deck"]).size, width * ArchetypeUnits.INCH);
    near(`board ${size}: length`, archetypeExtent(board, "z", ["deck"]).size, length * ArchetypeUnits.INCH);
    const front: { low: number; high: number } = archetypeExtent(board, "z", [
      "wheel-front-left",
    ]);
    const back: { low: number; high: number } = archetypeExtent(board, "z", [
      "wheel-back-left",
    ]);
    near(
      `board ${size}: wheelbase`,
      (back.low + back.high) / 2 - (front.low + front.high) / 2,
      wheelbase * ArchetypeUnits.INCH,
    );
    const deck: { low: number; high: number; size: number } = archetypeExtent(
      board,
      "y",
      ["deck"],
    );
    near(`board ${size}: thickness`, deck.size, (7 / 16) * ArchetypeUnits.INCH);
    near(`board ${size}: underside`, deck.low, 0.026 + 0.055);
    near(`board ${size}: the deck contact`, board.affordance("deck").frame.translation.y, deck.high);
    near(`board ${size}: the nose`, board.affordance("nose").frame.translation.z, -(length * ArchetypeUnits.INCH) / 2);
    near(`board ${size}: the tail`, board.affordance("tail").frame.translation.z, (length * ArchetypeUnits.INCH) / 2);
    near(`board ${size}: the wheels`, archetypeExtent(board, "y", ["wheel-front-left"]).size, 0.052);
  }
  TestValidator.equals("a skateboard is its makers' parts", findings, []);
}
