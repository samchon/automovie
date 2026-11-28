import { AutoMovieArchetypeUnits, AutoMovieArchetypeSaloonDoor } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Saloon doors hang at the maker's leaf and opening sizes, each leaf half the opening, and swing out on their gravity hinges.
 *
 * Scenarios:
 * 1. Over 200 seeds the opening is exactly one of the maker's 30, 32 and 36 in, each drawn, each leaf half of it, 40 in high and 3/4 in thick, its foot 18 to 24 in up (the unbranded sheet, provisional).
 * 2. Each hinge opens the standard hinge's 125 degrees each way; at a quarter turn a leaf stands out toward `+Z` by its own width from its hinge axis at mid-thickness, its push face with it, and at a quarter turn back toward `-Z` as far, less the thickness its hinge stands in front of.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the catalogue openings, leaf dimensions, hinge travel in either direction and both moving push faces.
 * @evidence contracts/development/testing.md#behavioral-verification Measures colliders and contact frames across the seeded opening widths and at the rest and turned hinge poses. It checks both leaves and both signs of travel.
 * @evidence contracts/development/testing.md#independent-expectations Uses 30, 32 and 36 inch openings and the stated maker's leaf dimensions and hinge range. A quarter turn places the broad edge one leaf width from its hinge axis, adjusted by the authored hinge plane and thickness.
 */
export function test_archetype_saloon_door(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const inch: number = AutoMovieArchetypeUnits.INCH;
  findings.push(
    ...archetypeModelSweep([
      {
        name: "saloon door opening",
        measure: (seed: number): readonly number[] => [
          AutoMovieArchetypeSaloonDoor.create({}, seed).affordance("passage").width!,
        ],
        models: [[30 * inch], [32 * inch], [36 * inch]],
        source: "Swinging Cafe Doors",
      },
    ]),
    ...archetypeBandSweep([
      {
        name: "saloon door floor gap",
        measure: (seed: number): number =>
          archetypeExtent(AutoMovieArchetypeSaloonDoor.create({}, seed), "y").low,
        minimum: 18 * inch,
        maximum: 24 * inch,
        source: "unbranded installation sheet",
      },
    ]),
  );
  const doors: ReturnType<typeof AutoMovieArchetypeSaloonDoor.create> = AutoMovieArchetypeSaloonDoor.create({}, 4);
  const opening: number = doors.affordance("passage").width!;
  near(
    "the left leaf's width",
    archetypeExtent(doors, "x", ["leaf-left"]).size,
    opening / 2,
  );
  near(
    "a leaf's height",
    archetypeExtent(doors, "y", ["leaf-left"]).size,
    40 * inch,
  );
  near(
    "a leaf's thickness",
    archetypeExtent(doors, "z", ["leaf-left"]).size,
    0.75 * inch,
  );
  for (const id of ["leftLeaf", "rightLeaf"] as const)
    if (
      doors.affordance(id).travel !== 125 ||
      doors.affordance(id).reverse !== 125
    )
      findings.push(
        `${id} opens ${doors.affordance(id).travel} and back ${doors.affordance(id).reverse} degrees, 125 each way expected`,
      );
  const open: ReturnType<typeof AutoMovieArchetypeSaloonDoor.create> = doors.articulate({
    leftLeaf: 90,
    rightLeaf: 90,
  });
  for (const part of ["leaf-left", "leaf-right"])
    near(
      `the open ${part}'s reach`,
      archetypeExtent(open, "z", [part]).high,
      opening / 2 + (0.75 * inch) / 2,
    );
  const back: ReturnType<typeof AutoMovieArchetypeSaloonDoor.create> = doors.articulate({
    leftLeaf: -90,
    rightLeaf: -90,
  });
  for (const part of ["leaf-left", "leaf-right"])
    near(
      `the ${part} pushed back's reach`,
      -archetypeExtent(back, "z", [part]).low,
      opening / 2 - (0.75 * inch) / 2,
    );
  if (!(open.affordance("leftPush").frame.translation.z > opening / 8))
    findings.push("the left push face stays behind its open leaf");
  TestValidator.equals(
    "saloon doors hang and swing as the maker's",
    findings,
    [],
  );
}
