import { ArchetypeFrame, createSanitary } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypePlaced } from "../internal/archetypePlaced";

/** The accessibility standard. */
const ADA: string = "2010 ADA Standards";

/**
 * The sanitary fixtures are placed where they were put, declare their contacts with the kinds an act reads, and the heights a person meets stay inside the ADA clauses and the makers' sheets for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. A washbasin, a toilet, a bath and a transfer shower placed on a line through the public chain, each turned a different way: each rests at its placement on the floor within a millimetre, and every contact is a named point of the prop.
 * 2. Each kind declares exactly its contacts with their kinds: a basin's `rim` ledge, `bowl` surface, `tap` knob and `spout` socket; a toilet's `seat` and `lid` hinge; a bath's `rim` ledge and `bottom` surface; a shower's `tray` surface, `threshold` ledge, `entry` aperture, `seat` and `control` knob.
 * 3. Over 200 seeds: the toilet's seat top 430 to 485 mm (ADA 604.4), as its contact and as its ring's collider; the basin's rim at most 865 mm (ADA 606.3) as its contact and its block's top; the shower seat 430 to 485 mm (ADA 610.3), its front edge 380 to 405 mm from the seat wall (ADA 610.3.1), the valve 965 to 1220 mm (ADA 608.5.1), the inside 915 mm between the side walls (ADA 608.2.1) and the threshold at most 13 mm (ADA 608.7); the bath 1524 mm long, its apron 356 mm high and its width 762 to 768 mm (Kohler K-837, American Standard Princeton); the toilet's bowl front 756 mm from the wall and its tank top 794 mm (Kohler K-3999).
 * 4. A toilet seat faces away from the wall and a shower seat faces away from its seat wall, toward the valve: their frames' `+Z` point along `+Z` and `-X`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every kind through the public chain and reads the displayed prop frames, and measures colliders and contacts on the produced fixtures; a fixture that floats, a contact of the wrong kind, a seat or rim off its clause, a seat facing the wall or a shower narrower than its clause fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are the clauses' and the sheets' own numbers, written here; the shower seat's depth is measured from the seat wall's inner face, the collider, not from a dimension the producer records.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind once for placement and contacts; code limits as one-sided limits and the makers' fixed sizes as exact bands; articulation of the lid belongs to `test_archetype_fixture_articulation`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_sanitary_placed(): void {
  // 1. Placed.
  const findings: string[] = archetypePlaced(
    createSanitary.KINDS.map(
      (kind: createSanitary.Kind, index: number): archetypePlaced.IRow => ({
        name: `sanitary-${kind}`,
        archetype: createSanitary({ kind }),
        yaw: 90 * index,
      }),
    ),
  );

  // 2. The contacts and their kinds.
  const expected: Readonly<
    Record<createSanitary.Kind, Readonly<Record<string, string>>>
  > = {
    washbasin: { rim: "ledge", bowl: "surface", tap: "knob", spout: "socket" },
    toilet: { seat: "seat", lid: "hinge" },
    bathtub: { rim: "ledge", bottom: "surface" },
    shower: {
      tray: "surface",
      threshold: "ledge",
      entry: "aperture",
      seat: "seat",
      control: "knob",
    },
  };
  for (const kind of createSanitary.KINDS) {
    const declared: string = createSanitary({ kind })
      .affordances.map((a: IAutoMovieAffordance): string => `${a.id}:${a.kind}`)
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .join(",");
    const wanted: string = Object.entries(expected[kind])
      .map(([id, k]: [string, string]): string => `${id}:${k}`)
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .join(",");
    if (declared !== wanted)
      findings.push(`${kind} declares ${declared}, ${wanted} expected`);
  }

  // 3. The bands.
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
    limit?: boolean,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
    ...(limit === true ? { limit } : {}),
  });
  const make = (
    kind: createSanitary.Kind,
    seed: number,
  ): ReturnType<typeof createSanitary> => createSanitary({ kind }, seed);
  const y = (
    kind: createSanitary.Kind,
    seed: number,
    id: createSanitary.Affordance,
  ): number => make(kind, seed).affordance(id).frame.translation.y;
  findings.push(
    ...archetypeBandSweep([
      row("toilet seat", 0.43, 0.485, `${ADA} 604.4`, (s: number): number =>
        y("toilet", s, "seat"),
      ),
      row(
        "toilet seat ring top",
        0.43,
        0.485,
        `${ADA} 604.4`,
        (s: number): number =>
          archetypeExtent(make("toilet", s), "y", ["ring"]).high,
      ),
      row(
        "basin rim",
        0,
        0.865,
        `${ADA} 606.3`,
        (s: number): number => y("washbasin", s, "rim"),
        true,
      ),
      row(
        "basin block top",
        0,
        0.865,
        `${ADA} 606.3`,
        (s: number): number =>
          archetypeExtent(make("washbasin", s), "y", ["basin"]).high,
        true,
      ),
      row("shower seat", 0.43, 0.485, `${ADA} 610.3`, (s: number): number =>
        y("shower", s, "seat"),
      ),
      row(
        "shower seat depth from its wall",
        0.38,
        0.405,
        `${ADA} 610.3.1`,
        (s: number): number => {
          const shower: ReturnType<typeof createSanitary> = make("shower", s);
          const wall: number = archetypeExtent(shower, "x", ["wall-left"]).low;
          return wall - shower.affordance("seat").frame.translation.x;
        },
      ),
      row("shower valve", 0.965, 1.22, `${ADA} 608.5.1`, (s: number): number =>
        y("shower", s, "control"),
      ),
      row(
        "shower inside",
        0.915,
        0.915,
        `${ADA} 608.2.1`,
        (s: number): number => {
          const shower: ReturnType<typeof createSanitary> = make("shower", s);
          return (
            archetypeExtent(shower, "x", ["wall-left"]).low -
            archetypeExtent(shower, "x", ["wall-right"]).high
          );
        },
      ),
      row(
        "shower threshold",
        0,
        0.013,
        `${ADA} 608.7`,
        (s: number): number => y("shower", s, "threshold"),
        true,
      ),
      row(
        "bath length",
        1.524,
        1.524,
        "Kohler K-837, 60 in",
        (s: number): number => archetypeExtent(make("bathtub", s), "x").size,
      ),
      row(
        "bath apron",
        0.356,
        0.356,
        "Kohler K-837, 14 in",
        (s: number): number => archetypeExtent(make("bathtub", s), "y").high,
      ),
      row(
        "bath width",
        0.762,
        0.768,
        "American Standard Princeton 30 in to Kohler K-837 30-1/4 in",
        (s: number): number => archetypeExtent(make("bathtub", s), "z").size,
      ),
      row(
        "toilet bowl front from the wall",
        0.756,
        0.756,
        "Kohler K-3999, 29-3/4 in",
        (s: number): number => archetypeExtent(make("toilet", s), "z").high,
      ),
      row(
        "toilet tank top",
        0.794,
        0.794,
        "Kohler K-3999, 31-1/4 in",
        (s: number): number =>
          archetypeExtent(make("toilet", s), "y", ["tank"]).high,
      ),
    ]),
  );

  // 4. Which way the seats face.
  for (const [kind, x, z] of [
    ["toilet", 0, 1],
    ["shower", -1, 0],
  ] as const) {
    const facing: IAutoMovieVector3 = ArchetypeFrame.axis(
      make(kind, 3).affordance("seat").frame,
      "z",
    );
    if (Math.abs(facing.x - x) > 1e-9 || Math.abs(facing.z - z) > 1e-9)
      findings.push(
        `the ${kind} seat faces (${facing.x}, ${facing.z}), (${x}, ${z}) expected`,
      );
  }
  TestValidator.equals(
    "sanitary fixtures are placed and sized",
    findings,
    [],
  );
}
