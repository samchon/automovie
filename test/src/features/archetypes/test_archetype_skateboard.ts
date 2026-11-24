import {
  AutoMovieArchetypeUnits,
  createSkateboard,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A skateboard is one of Powell Peralta's two decks whole, seven 1/16 in plies thick, on Independent's 55 mm trucks and Spitfire's 52 mm wheels.
 *
 * Scenarios:
 * 1. The 7.75x31.75 deck is 7.75 x 31.75 in with a 14 in wheelbase, the 8.5x33.5 deck 8.5 x 33.5 in with 15 in; over 200 seeds every deck drawn is one of the two exactly, and both are drawn.
 * 2. The deck is 7/16 in thick, its underside 55 mm over the axles and the axles a 52 mm wheel's radius up, so its `deck` lies at the sum.
 * 3. `nose` and `tail` lie on the deck's ends.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts for each deck and over seeds; a deck off its maker's sizes, one between the two read, or a deck floating off its trucks, is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are Powell Peralta's, Roarockit's, Independent's and Spitfire's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases Both decks given, then the seeds' draws; both ends of the deck.
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
    ["7.75x31.75", 7.75, 31.75, 14],
    ["8.5x33.5", 8.5, 33.5, 15],
  ] as const) {
    const board: ReturnType<typeof createSkateboard> = createSkateboard({
      model: size,
    });
    near(
      `board ${size}: width`,
      archetypeExtent(board, "x", ["deck"]).size,
      width * AutoMovieArchetypeUnits.INCH,
    );
    near(
      `board ${size}: length`,
      archetypeExtent(board, "z", ["deck"]).size,
      length * AutoMovieArchetypeUnits.INCH,
    );
    const front: { low: number; high: number } = archetypeExtent(board, "z", [
      "wheel-front-left",
    ]);
    const back: { low: number; high: number } = archetypeExtent(board, "z", [
      "wheel-back-left",
    ]);
    near(
      `board ${size}: wheelbase`,
      (back.low + back.high) / 2 - (front.low + front.high) / 2,
      wheelbase * AutoMovieArchetypeUnits.INCH,
    );
    const deck: { low: number; high: number; size: number } = archetypeExtent(
      board,
      "y",
      ["deck"],
    );
    near(
      `board ${size}: thickness`,
      deck.size,
      (7 / 16) * AutoMovieArchetypeUnits.INCH,
    );
    near(`board ${size}: underside`, deck.low, 0.026 + 0.055);
    near(
      `board ${size}: the deck contact`,
      board.affordance("deck").frame.translation.y,
      deck.high,
    );
    near(
      `board ${size}: the nose`,
      board.affordance("nose").frame.translation.z,
      -(length * AutoMovieArchetypeUnits.INCH) / 2,
    );
    near(
      `board ${size}: the tail`,
      board.affordance("tail").frame.translation.z,
      (length * AutoMovieArchetypeUnits.INCH) / 2,
    );
    near(
      `board ${size}: the wheels`,
      archetypeExtent(board, "y", ["wheel-front-left"]).size,
      0.052,
    );
  }
  const drawn: Set<number> = new Set();
  for (let seed: number = 0; seed < 200; seed++) {
    const board: ReturnType<typeof createSkateboard> = createSkateboard(
      {},
      seed,
    );
    const width: number = archetypeExtent(board, "x", ["deck"]).size;
    const length: number = archetypeExtent(board, "z", ["deck"]).size;
    const index: number = [
      [7.75, 31.75],
      [8.5, 33.5],
    ].findIndex(
      ([w, l]: number[]): boolean =>
        Math.abs(w! * AutoMovieArchetypeUnits.INCH - width) <= 1e-9 &&
        Math.abs(l! * AutoMovieArchetypeUnits.INCH - length) <= 1e-9,
    );
    if (index < 0)
      findings.push(
        `seed ${seed}: a ${width} by ${length} m deck is no read deck`,
      );
    else drawn.add(index);
  }
  if (drawn.size !== 2)
    findings.push(`200 seeds drew ${drawn.size} of the two decks`);
  TestValidator.equals("a skateboard is its makers' parts", findings, []);
}
