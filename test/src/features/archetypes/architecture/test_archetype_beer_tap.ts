import { AutoMovieArchetypeUnits, AutoMovieArchetypeBeerTap } from "@automovie/archetypes";
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
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed tower extents and both faucet locations, spout undersides and lever stud tops.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the generated tower colliders and both sets of faucet contacts. Reading both sides distinguishes a shared correct vertical offset from a head or faucet placed to one side.
 * @evidence contracts/development/testing.md#independent-expectations Uses the manufacturer's tower and head dimensions, the literal 5.5 inch faucet separation and the measured spout and stud offsets. The head midpoint is its top minus half its depth.
 */
export function test_archetype_beer_tap(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const mm: number = AutoMovieArchetypeUnits.MILLIMETRE;
  const tower: ReturnType<typeof AutoMovieArchetypeBeerTap.create> = AutoMovieArchetypeBeerTap.create({}, 2);
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
