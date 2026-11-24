import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  createCueTable,
  createSurfboard,
} from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A pool table is the WPA's 9 ft table and a surfboard is one of the maker's 5'10, 6'0 and 6'2 boards, whole.
 *
 * Scenarios:
 * 1. A pool table's bed is 100 by 50 in within the rule's 1/8 in, 29 1/4 to 31 in up; its cushions' nose lines stand 62 1/2 to 64 1/2% of a 2 1/4 in ball over the bed. Each named rail ledge spans the length of its own cushion segment next to the pockets.
 * 2. Each surfboard given is its chart row, 5'10 x 18.75 x 2.36, 6'0 x 19.18 x 2.40 or 6'2 x 19.50 x 2.50 in, its deck its top and its rail on its `+X` edge. Both lower rail lines reach from nose to tail. Over 200 seeds every board drawn is one of the three exactly, and all three are drawn.
 */
export function test_unit_archetypes_core_cue_table_surfboard(): void {
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
        minimum: 29.25 * AutoMovieArchetypeUnits.INCH,
        maximum: 31 * AutoMovieArchetypeUnits.INCH,
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
        minimum: 0.625 * 2.25 * AutoMovieArchetypeUnits.INCH,
        maximum: 0.645 * 2.25 * AutoMovieArchetypeUnits.INCH,
        source: "WPA 7",
      },
      {
        name: "pool table rail width",
        measure: (seed: number): number =>
          archetypeExtent(createCueTable({}, seed), "x", ["rail-left"]).size,
        minimum: 4 * AutoMovieArchetypeUnits.INCH,
        maximum: 7.5 * AutoMovieArchetypeUnits.INCH,
        source: "WPA 6",
      },
    ]),
  );
  const table: ReturnType<typeof createCueTable> = createCueTable({}, 4);
  const width: number = table.affordance("bed").width!;
  const length: number = table.affordance("bed").depth!;
  if (
    !(
      width >= 50 * AutoMovieArchetypeUnits.INCH - 1e-9 &&
      width <= 50.125 * AutoMovieArchetypeUnits.INCH + 1e-9
    )
  )
    findings.push(`the bed is ${width} wide`);
  if (
    !(
      length >= 100 * AutoMovieArchetypeUnits.INCH - 1e-9 &&
      length <= 100.125 * AutoMovieArchetypeUnits.INCH + 1e-9
    )
  )
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
  for (const [id, part, axis] of [
    ["leftRail", "rail-left", "z"],
    ["rightRail", "rail-right", "z"],
    ["headRail", "rail-head", "x"],
    ["footRail", "rail-foot", "x"],
  ] as const) {
    const rail: IAutoMovieAffordance = table.affordance(id);
    const drawn: ReturnType<typeof archetypeExtent> = archetypeExtent(
      table,
      axis,
      [part],
    );
    near(
      `${id} is centred on its drawn cushion`,
      rail.frame.translation[axis],
      (drawn.low + drawn.high) / 2,
    );
    near(`${id} stops at the cushion ends`, rail.length!, drawn.size);
  }

  // 2. The surfboard.
  const chart: readonly (readonly [
    createSurfboard.Model,
    number,
    number,
    number,
  ])[] = [
    [
      "5'10",
      70 * AutoMovieArchetypeUnits.INCH,
      18.75 * AutoMovieArchetypeUnits.INCH,
      2.36 * AutoMovieArchetypeUnits.INCH,
    ],
    [
      "6'0",
      72 * AutoMovieArchetypeUnits.INCH,
      19.18 * AutoMovieArchetypeUnits.INCH,
      2.4 * AutoMovieArchetypeUnits.INCH,
    ],
    [
      "6'2",
      74 * AutoMovieArchetypeUnits.INCH,
      19.5 * AutoMovieArchetypeUnits.INCH,
      2.5 * AutoMovieArchetypeUnits.INCH,
    ],
  ];
  for (const [size, length, width, thickness] of chart) {
    const board: ReturnType<typeof createSurfboard> = createSurfboard({
      model: size,
    });
    near(`board ${size}: length`, archetypeExtent(board, "z").size, length);
    near(`board ${size}: width`, archetypeExtent(board, "x").size, width);
    near(
      `board ${size}: thickness`,
      archetypeExtent(board, "y").size,
      thickness,
    );
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
    for (const [id, sign] of [
      ["leftRail", 1],
      ["rightRail", -1],
    ] as const) {
      const edge: IAutoMovieAffordance = board.affordance(id);
      const tangent: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
        edge.frame,
        "x",
      );
      near(
        `board ${size}: ${id} lies on the board side`,
        edge.frame.translation.x,
        (sign * width) / 2,
      );
      near(
        `board ${size}: ${id} runs from nose to tail`,
        Math.abs(tangent.z) * edge.length!,
        length,
      );
    }
  }
  const drawn: Set<string> = new Set();
  for (let seed: number = 0; seed < 200; seed++) {
    const board: ReturnType<typeof createSurfboard> = createSurfboard({}, seed);
    const length: number = archetypeExtent(board, "z").size;
    const width: number = archetypeExtent(board, "x").size;
    const thickness: number = archetypeExtent(board, "y").size;
    const row:
      | readonly [createSurfboard.Model, number, number, number]
      | undefined = chart.find(
      ([, l, w, t]: readonly [
        createSurfboard.Model,
        number,
        number,
        number,
      ]): boolean =>
        Math.abs(l - length) <= 1e-9 &&
        Math.abs(w - width) <= 1e-9 &&
        Math.abs(t - thickness) <= 1e-9,
    );
    if (row === undefined)
      findings.push(`seed ${seed}: a ${length} m board is no chart row`);
    else drawn.add(row[0]);
  }
  if (drawn.size !== chart.length)
    findings.push(`200 seeds drew only ${[...drawn].join(", ")}`);
  TestValidator.equals(
    "a pool table and a surfboard stand at their sources",
    findings,
    [],
  );
}
