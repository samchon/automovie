import {
  ArchetypeUnits,
  createCellFront,
  createHandhold,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypeModelSweep } from "../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Transit handholds stand at the federal rule's diameter and the bus specification's height, and a cell front at the detention maker's bars and centres.
 *
 * Scenarios:
 * 1. A pole and an overhead rail are 1 1/4 to 1 1/2 in across (49 CFR 38.29), the pole up to and the rail at 70 in (the Duluth specification's least).
 * 2. Over 200 seeds a strap is exactly one of HAPPICH's six, its loop foot 625 or 673 mm below the rail with its own clamping piece's mass, 100, 125 or 150 g and 110, 135 or 160 g, each drawn.
 * 3. A cell front of 12 bars has 7/8 in bars at 4 in centres to 8 ft, each a `bar` contact as long as the grille; fewer than 2 bars are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds and tries a refused count; a hold or a grille off its sources, or a strap's length paired with another strap's mass, is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are the rule's, the bus specification's, HAPPICH's and the detention maker's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases An upright pole, a hanging strap and a barred front; a valid and a refused bar count.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_handhold_cell_front(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const inch: number = ArchetypeUnits.INCH;

  // 1. and 2. The handholds.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "pole diameter",
        measure: (seed: number): number =>
          archetypeExtent(createHandhold({ kind: "pole" }, seed), "x").size,
        minimum: 1.25 * inch,
        maximum: 1.5 * inch,
        source: "49 CFR 38.29",
      },
    ]),
    ...archetypeModelSweep([
      {
        name: "strap length and mass",
        measure: (seed: number): readonly number[] => {
          const strap: ReturnType<typeof createHandhold> = createHandhold(
            { kind: "strap" },
            seed,
          );
          return [
            strap.affordance("rail").frame.translation.y -
              strap.affordance("strap").frame.translation.y,
            strap.properties.mass,
          ];
        },
        models: [
          [0.625, 0.1],
          [0.625, 0.125],
          [0.625, 0.15],
          [0.673, 0.11],
          [0.673, 0.135],
          [0.673, 0.16],
        ],
        source: "HAPPICH straps",
      },
    ]),
  );
  const pole: ReturnType<typeof createHandhold> = createHandhold(
    { kind: "pole" },
    3,
  );
  near("the pole's top", archetypeExtent(pole, "y").high, 70 * inch);
  near("the pole's bar", pole.affordance("pole").length!, 70 * inch);
  const strap: ReturnType<typeof createHandhold> = createHandhold(
    { kind: "strap" },
    3,
  );
  near(
    "the overhead rail",
    strap.affordance("rail").frame.translation.y,
    70 * inch,
  );

  // 3. The cell front.
  const front: ReturnType<typeof createCellFront> = createCellFront(
    { bars: 12 },
    3,
  );
  near(
    "the grille's height",
    archetypeExtent(front, "y").high,
    8 * ArchetypeUnits.FOOT,
  );
  near(
    "a bar's diameter",
    archetypeExtent(front, "x", ["bar-1"]).size,
    (7 / 8) * inch,
  );
  near(
    "the bars' centres",
    front.affordance("bar2").frame.translation.x -
      front.affordance("bar1").frame.translation.x,
    4 * inch,
  );
  near(
    "a bar's length",
    front.affordance("bar12").length!,
    8 * ArchetypeUnits.FOOT,
  );
  try {
    createCellFront({ bars: 1 });
    findings.push("a one-bar cell front was built");
  } catch {
    // Refused, as a count under two is.
  }
  TestValidator.equals(
    "handholds and cell fronts stand at their sources",
    findings,
    [],
  );
}
