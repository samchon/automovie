import { AutoMovieArchetypeUnits, createTable } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A pupil desk and an altar stay inside their makers' dimensions for every seed, measured on the produced thing, and an altar stands on two pedestals.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a pupil desk with an 18 by 24 in top, 33 lb, standing at one of its sheet's 1 in steps from 19 to 31 in exactly, each step drawn; an altar 40 in high with a 72 by 30 in top, 275 to 450 lb.
 * 2. For three seeds, the pupil desk's top is its sheet's 5/8 in thick, and the altar's two pedestals stand on the floor under the top's two ends, each reaching the top's underside.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces both kinds for 200 seeds and measures their colliders and masses; a band other than the citation's, a seed that does not vary it, a desk's top of another thickness, or an altar's pedestal off the floor, short of the top or under its middle is caught.
 * @evidence contracts/development/testing.md#independent-expectations Smith System's sheet for the Silhouette #01601 and Woerner's catalog for the 5061 altar, with Woerner's other altars' listed weights bounding the unread mass.
 * @evidence contracts/development/testing.md#distinguishing-cases The two kinds the producer gained, one on legs and one on pedestals; the older kinds belong to their own specs.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_table_pupil_desk_altar(): void {
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const pound: number = AutoMovieArchetypeUnits.POUND;
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const desk = (seed: number): ReturnType<typeof createTable> =>
    createTable({ kind: "pupilDesk" }, seed);
  const altar = (seed: number): ReturnType<typeof createTable> =>
    createTable({ kind: "altar" }, seed);
  const findings: string[] = archetypeBandSweep([
    row(
      "desk length",
      24 * inch,
      24 * inch,
      "Smith System",
      (seed: number): number => archetypeExtent(desk(seed), "x", ["top"]).size,
    ),
    row(
      "desk depth",
      18 * inch,
      18 * inch,
      "Smith System",
      (seed: number): number => archetypeExtent(desk(seed), "z", ["top"]).size,
    ),
    row(
      "desk mass",
      33 * pound,
      33 * pound,
      "Smith System",
      (seed: number): number => desk(seed).body.mass,
    ),
    row(
      "altar height",
      40 * inch,
      40 * inch,
      "Woerner",
      (seed: number): number => archetypeExtent(altar(seed), "y").size,
    ),
    row(
      "altar length",
      72 * inch,
      72 * inch,
      "Woerner",
      (seed: number): number => archetypeExtent(altar(seed), "x", ["top"]).size,
    ),
    row(
      "altar depth",
      30 * inch,
      30 * inch,
      "Woerner",
      (seed: number): number => archetypeExtent(altar(seed), "z", ["top"]).size,
    ),
    row(
      "altar mass",
      275 * pound,
      450 * pound,
      "Woerner's other altars",
      (seed: number): number => altar(seed).body.mass,
    ),
  ]);
  // Over 200 seeds every desk stands at one of the sheet's 1 in steps from 19 to 31 in exactly, and each is drawn.
  const heights: Set<number> = new Set<number>();
  for (let seed: number = 0; seed < 200; seed++) {
    const height: number = archetypeExtent(desk(seed), "y").size / inch;
    const step: number = Math.round(height);
    if (Math.abs(height - step) > 1e-9 || step < 19 || step > 31)
      findings.push(`pupilDesk@${seed}: ${height} in is no listed step`);
    else heights.add(step);
  }
  if (heights.size !== 13)
    findings.push(`200 seeds drew ${heights.size} of the desk's 13 heights`);
  for (const seed of [0, 1, 2]) {
    if (
      Math.abs(
        archetypeExtent(desk(seed), "y", ["top"]).size - (5 / 8) * inch,
      ) > 1e-9
    )
      findings.push(`pupilDesk@${seed}: the top is not 5/8 in thick`);
    const made: ReturnType<typeof createTable> = altar(seed);
    const under: number = archetypeExtent(made, "y", ["top"]).low;
    for (const [id, sign] of [
      ["pedestal-left", 1],
      ["pedestal-right", -1],
    ] as const) {
      const y: ReturnType<typeof archetypeExtent> = archetypeExtent(made, "y", [
        id,
      ]);
      const x: ReturnType<typeof archetypeExtent> = archetypeExtent(made, "x", [
        id,
      ]);
      if (
        Math.abs(y.low) > 1e-9 ||
        Math.abs(y.high - under) > 1e-9 ||
        sign * (x.low + x.high) <= 0
      )
        findings.push(
          `altar@${seed}: ${id} is off the floor, short of the top or under its middle`,
        );
    }
  }
  TestValidator.equals(
    "the pupil desk and the altar stay in their makers' bands",
    findings,
    [],
  );
}
