import { AutoMovieArchetypeUnits, createBag } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A briefcase, a toolbox, a handbag and a duffel are sized as their makers publish for every seed, a suitcase's, a briefcase's, a toolbox's and a duffel's top handle is the Revised NIOSH Lifting Equation's optimal handle above the top, and a handbag's handle stands its read drop above it.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a briefcase 41.5 to 45.2 cm wide, 35 to 39.4 cm high and 8.5 to 14.7 cm deep, 2.3 to 2.95 kg; a toolbox 48.2 cm wide, 25 cm high and 25.4 cm deep, 1.5 kg; a handbag 30 by 28 by 20 cm, its handle's top 11 to 12 cm above it, 240 g; a duffel 25 by 14 by 14 in, 1.62 kg; every one's handle bar 1.9 to 3.8 cm across.
 * 2. For three seeds of the suitcase, the briefcase, the toolbox and the duffel, the `handle` is 11.5 cm long, its bar's underside 5 cm above the body's top, its frame at the bar's centre; for the handbag, 11.5 cm long, its top the drawn drop above the body's top.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each bag for 200 seeds and measures its body, its handle bar and its mass; a size other than the maker's, a seed that does not vary it, a bar off the NIOSH diameters, or a handle at another length or clearance is caught.
 * @evidence contracts/development/testing.md#independent-expectations Samsonite's and Rimowa's attaches, Stanley's toolbox, Longchamp's handbag, The North Face's duffel, and the Applications Manual for the Revised NIOSH Lifting Equation's optimal handle, written here as literals.
 * @evidence contracts/development/testing.md#distinguishing-cases The four kinds the producer gained and the suitcase whose handle moved to the NIOSH handle; the tote and the backpack keep their straps and their own spec.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_props_bag_bands(): void {
  const bag = (
    kind: "suitcase" | "briefcase" | "toolbox" | "handbag" | "duffel",
    seed: number,
  ): ReturnType<typeof createBag> => createBag({ kind }, seed);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const ATTACHE: string = "Samsonite and Rimowa attaches";
  const STANLEY: string = "Stanley STST1-75520";
  const NIOSH: string = "NIOSH 94-110 optimal handle";
  const LONGCHAMP: string = "Longchamp Le Pliage M";
  const TNF: string = "The North Face Base Camp Duffel M";
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const findings: string[] = archetypeBandSweep([
    row(
      "briefcase width",
      0.415,
      0.452,
      ATTACHE,
      (s: number): number =>
        archetypeExtent(bag("briefcase", s), "x", ["body"]).size,
    ),
    row(
      "briefcase height",
      0.35,
      0.394,
      ATTACHE,
      (s: number): number =>
        archetypeExtent(bag("briefcase", s), "y", ["body"]).size,
    ),
    row(
      "briefcase depth",
      0.085,
      0.147,
      ATTACHE,
      (s: number): number =>
        archetypeExtent(bag("briefcase", s), "z", ["body"]).size,
    ),
    row(
      "briefcase mass",
      2.3,
      2.95,
      ATTACHE,
      (s: number): number => bag("briefcase", s).body.mass,
    ),
    row(
      "toolbox width",
      0.482,
      0.482,
      STANLEY,
      (s: number): number =>
        archetypeExtent(bag("toolbox", s), "x", ["body"]).size,
    ),
    row(
      "toolbox height",
      0.25,
      0.25,
      STANLEY,
      (s: number): number =>
        archetypeExtent(bag("toolbox", s), "y", ["body"]).size,
    ),
    row(
      "toolbox depth",
      0.254,
      0.254,
      STANLEY,
      (s: number): number =>
        archetypeExtent(bag("toolbox", s), "z", ["body"]).size,
    ),
    row(
      "toolbox mass",
      1.5,
      1.5,
      STANLEY,
      (s: number): number => bag("toolbox", s).body.mass,
    ),
    row(
      "handbag width",
      0.3,
      0.3,
      LONGCHAMP,
      (s: number): number =>
        archetypeExtent(bag("handbag", s), "x", ["body"]).size,
    ),
    row(
      "handbag height",
      0.28,
      0.28,
      LONGCHAMP,
      (s: number): number =>
        archetypeExtent(bag("handbag", s), "y", ["body"]).size,
    ),
    row(
      "handbag depth",
      0.2,
      0.2,
      LONGCHAMP,
      (s: number): number =>
        archetypeExtent(bag("handbag", s), "z", ["body"]).size,
    ),
    row("handbag drop", 0.11, 0.12, LONGCHAMP, (s: number): number => {
      const made: ReturnType<typeof createBag> = bag("handbag", s);
      return (
        archetypeExtent(made, "y", ["handle"]).high -
        archetypeExtent(made, "y", ["body"]).high
      );
    }),
    row(
      "handbag mass",
      0.24,
      0.24,
      LONGCHAMP,
      (s: number): number => bag("handbag", s).body.mass,
    ),
    row(
      "duffel width",
      25 * inch,
      25 * inch,
      TNF,
      (s: number): number =>
        archetypeExtent(bag("duffel", s), "x", ["body"]).size,
    ),
    row(
      "duffel height",
      14 * inch,
      14 * inch,
      TNF,
      (s: number): number =>
        archetypeExtent(bag("duffel", s), "y", ["body"]).size,
    ),
    row(
      "duffel depth",
      14 * inch,
      14 * inch,
      TNF,
      (s: number): number =>
        archetypeExtent(bag("duffel", s), "z", ["body"]).size,
    ),
    row(
      "duffel mass",
      1.62,
      1.62,
      TNF,
      (s: number): number => bag("duffel", s).body.mass,
    ),
    ...(["suitcase", "briefcase", "toolbox", "handbag", "duffel"] as const).map(
      (
        kind: "suitcase" | "briefcase" | "toolbox" | "handbag" | "duffel",
      ): archetypeBandSweep.IRow =>
        row(
          `${kind} handle bar`,
          0.019,
          0.038,
          NIOSH,
          (s: number): number =>
            archetypeExtent(bag(kind, s), "z", ["handle"]).size,
        ),
    ),
  ]);
  for (const seed of [0, 1, 2])
    for (const kind of [
      "suitcase",
      "briefcase",
      "toolbox",
      "duffel",
    ] as const) {
      const made: ReturnType<typeof createBag> = bag(kind, seed);
      const handle: ReturnType<typeof made.affordance> =
        made.affordance("handle");
      const top: number = archetypeExtent(made, "y", ["body"]).high;
      const bar: ReturnType<typeof archetypeExtent> = archetypeExtent(
        made,
        "y",
        ["handle"],
      );
      if (
        Math.abs(handle.length! - 0.115) > 1e-9 ||
        Math.abs(bar.low - top - 0.05) > 1e-9 ||
        Math.abs(handle.frame.translation.y - (bar.low + bar.high) / 2) > 1e-9
      )
        findings.push(`${kind}@${seed}: the handle is off the NIOSH handle`);
    }
  for (const seed of [0, 1, 2]) {
    const made: ReturnType<typeof createBag> = bag("handbag", seed);
    if (
      Math.abs(made.affordance("handle").length! - 0.115) > 1e-9 ||
      Math.abs(
        archetypeExtent(made, "y", ["handle"]).high -
          archetypeExtent(made, "y", ["body"]).high -
          made.dimensions.handleDrop!,
      ) > 1e-9
    )
      findings.push(`handbag@${seed}: the handle is off its drop`);
  }
  TestValidator.equals(
    "the cased and carried bags and their handles stay as cited",
    findings,
    [],
  );
}
