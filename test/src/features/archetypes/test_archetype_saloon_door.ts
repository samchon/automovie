import {
  AutoMovieArchetypeUnits,
  createSaloonDoor,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypeModelSweep } from "../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Saloon doors hang at the maker's leaf and opening sizes, each leaf half the opening, and swing out on their gravity hinges.
 *
 * Scenarios:
 * 1. Over 200 seeds the opening is exactly one of the maker's 30, 32 and 36 in, each drawn, each leaf half of it, 40 in high and 3/4 in thick, its foot 18 to 24 in up (the unbranded sheet, provisional).
 * 2. Each hinge opens the standard hinge's 125 degrees each way; at a quarter turn a leaf stands out toward `+Z` by its own width from its hinge axis at mid-thickness, its push face with it, and at a quarter turn back toward `-Z` as far, less the thickness its hinge stands in front of.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds and articulates the leaves; a leaf off its size or swinging the wrong way is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are the maker's and the sheet's restated here; a leaf of width w turned square about its hinge at mid-thickness reaches w out from that axis.
 * @evidence contracts/development/testing.md#distinguishing-cases Both leaves, at rest and turned.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
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
          createSaloonDoor({}, seed).affordance("passage").width!,
        ],
        models: [[30 * inch], [32 * inch], [36 * inch]],
        source: "Swinging Cafe Doors",
      },
    ]),
    ...archetypeBandSweep([
      {
        name: "saloon door floor gap",
        measure: (seed: number): number =>
          archetypeExtent(createSaloonDoor({}, seed), "y").low,
        minimum: 18 * inch,
        maximum: 24 * inch,
        source: "unbranded installation sheet",
      },
    ]),
  );
  const doors: ReturnType<typeof createSaloonDoor> = createSaloonDoor({}, 4);
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
  const open: ReturnType<typeof createSaloonDoor> = doors.articulate({
    leftLeaf: 90,
    rightLeaf: 90,
  });
  for (const part of ["leaf-left", "leaf-right"])
    near(
      `the open ${part}'s reach`,
      archetypeExtent(open, "z", [part]).high,
      opening / 2 + (0.75 * inch) / 2,
    );
  const back: ReturnType<typeof createSaloonDoor> = doors.articulate({
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
