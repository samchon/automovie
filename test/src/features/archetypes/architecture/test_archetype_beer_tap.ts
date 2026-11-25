import { AutoMovieArchetypeUnits, createBeerTap } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A beer tower stands at Perlick's sizes with Micro Matic's faucets.
 *
 * Scenarios:
 * 1. The tower rises 12 15/16 in from the counter on a 6 in base and a 4 5/8 in column, its head 6 7/16 in deep.
 * 2. Its two faucets are 5-1/2 in apart; each spout's tip is 42.15 mm under the head's middle and 44.03 mm out from its front, and each lever stud's top 97.64 mm over its spout's tip.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts; a tower off its maker's size or a spout or stud off its faucet's drawing is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are the makers' restated here; the head's middle is the tower's height less half the head's depth, worked here by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Both faucets.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_beer_tap(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const mm: number = AutoMovieArchetypeUnits.MILLIMETRE;
  const tower: ReturnType<typeof createBeerTap> = createBeerTap({}, 2);
  near(
    "the tower's height",
    archetypeExtent(tower, "y").high,
    (12 + 15 / 16) * inch,
  );
  near("its base across", archetypeExtent(tower, "x", ["base"]).size, 6 * inch);
  near(
    "its column across",
    archetypeExtent(tower, "z", ["column"]).size,
    (4 + 5 / 8) * inch,
  );
  near(
    "its head's depth",
    archetypeExtent(tower, "z", ["head"]).size,
    (6 + 7 / 16) * inch,
  );
  const middle: number = (12 + 15 / 16 - (6 + 7 / 16) / 2) * inch;
  const face: number = ((6 + 7 / 16) / 2) * inch;
  const left: IAutoMovieVector3 =
    tower.affordance("leftSpout").frame.translation;
  const right: IAutoMovieVector3 =
    tower.affordance("rightSpout").frame.translation;
  near("the faucets apart", left.x - right.x, 5.5 * inch);
  for (const [side, spout, tap] of [
    ["left", left, tower.affordance("leftTap").frame.translation],
    ["right", right, tower.affordance("rightTap").frame.translation],
  ] as const) {
    near(`the ${side} spout's drop`, middle - spout.y, 42.15 * mm);
    near(`the ${side} spout's reach`, spout.z - face, 44.03 * mm);
    near(`the ${side} stud's top`, tap.y - spout.y, 97.64 * mm);
  }
  TestValidator.equals("a beer tower is its makers'", findings, []);
}
