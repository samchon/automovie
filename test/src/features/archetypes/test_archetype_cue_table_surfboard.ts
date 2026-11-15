import { ArchetypeUnits, createCueTable, createSurfboard } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A pool table is the WPA's 9 ft table and a surfboard lies between the maker's 5'10 and 6'2 boards.
 *
 * Scenarios:
 * 1. A pool table's bed is 100 by 50 in within the rule's 1/8 in, 29 1/4 to 31 in up; its cushions' nose lines stand 62 1/2 to 64 1/2% of a 2 1/4 in ball over the bed along the bed's four edges, each facing out; its rails are 4 to 7 1/2 in wide.
 * 2. A surfboard at size 0 is the 5'10 x 18.75 x 2.36 in board and at size 1 the 6'2 x 19.50 x 2.50 in; its deck is its top and its rail on its `+X` edge.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts; a table or board off its source is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every figure is the WPA's or the maker's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases The four rails each way; both ends of the board's size.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_cue_table_surfboard(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The pool table.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "pool table bed height",
        measure: (seed: number): number =>
          createCueTable({}, seed).affordance("bed").frame.translation.y,
        minimum: 29.25 * ArchetypeUnits.INCH,
        maximum: 31 * ArchetypeUnits.INCH,
        source: "WPA 2",
      },
      {
        name: "pool table nose over the bed",
        measure: (seed: number): number => {
          const table: ReturnType<typeof createCueTable> = createCueTable(
            {},
            seed,
          );
          return (
            table.affordance("footRail").frame.translation.y -
            table.affordance("bed").frame.translation.y
          );
        },
        minimum: 0.625 * 2.25 * ArchetypeUnits.INCH,
        maximum: 0.645 * 2.25 * ArchetypeUnits.INCH,
        source: "WPA 7",
      },
      {
        name: "pool table rail width",
        measure: (seed: number): number =>
          archetypeExtent(createCueTable({}, seed), "x", ["rail-left"]).size,
        minimum: 4 * ArchetypeUnits.INCH,
        maximum: 7.5 * ArchetypeUnits.INCH,
        source: "WPA 6",
      },
    ]),
  );
  const table: ReturnType<typeof createCueTable> = createCueTable({}, 4);
  const width: number = table.affordance("bed").width!;
  const length: number = table.affordance("bed").depth!;
  if (!(width >= 50 * ArchetypeUnits.INCH - 1e-9 && width <= 50.125 * ArchetypeUnits.INCH + 1e-9))
    findings.push(`the bed is ${width} wide`);
  if (!(length >= 100 * ArchetypeUnits.INCH - 1e-9 && length <= 100.125 * ArchetypeUnits.INCH + 1e-9))
    findings.push(`the bed is ${length} long`);
  for (const [id, axis, sign] of [
    ["leftRail", "x", 1],
    ["rightRail", "x", -1],
    ["headRail", "z", -1],
    ["footRail", "z", 1],
  ] as const) {
    const at: number = table.affordance(id).frame.translation[axis];
    near(
      `the ${id}'s nose line`,
      sign * at,
      (axis === "x" ? width : length) / 2,
    );
  }

  // 2. The surfboard.
  for (const [size, length, width, thickness] of [
    [0, 70 * ArchetypeUnits.INCH, 18.75 * ArchetypeUnits.INCH, 2.36 * ArchetypeUnits.INCH],
    [1, 74 * ArchetypeUnits.INCH, 19.5 * ArchetypeUnits.INCH, 2.5 * ArchetypeUnits.INCH],
  ] as const) {
    const board: ReturnType<typeof createSurfboard> = createSurfboard({ size });
    near(`board ${size}: length`, archetypeExtent(board, "z").size, length);
    near(`board ${size}: width`, archetypeExtent(board, "x").size, width);
    near(`board ${size}: thickness`, archetypeExtent(board, "y").size, thickness);
    near(
      `board ${size}: the deck`,
      board.affordance("deck").frame.translation.y,
      thickness,
    );
    near(
      `board ${size}: the rail`,
      board.affordance("rail").frame.translation.x,
      width / 2,
    );
  }
  TestValidator.equals(
    "a pool table and a surfboard stand at their sources",
    findings,
    [],
  );
}
