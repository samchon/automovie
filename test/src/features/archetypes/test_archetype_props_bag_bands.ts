import { createBag } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A briefcase and a toolbox are sized as their makers publish for every seed, and a suitcase's, a briefcase's and a toolbox's top handle is the Revised NIOSH Lifting Equation's optimal handle above the top.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a briefcase 41.5 to 45.2 cm wide, 35 to 39.4 cm high and 8.5 to 14.7 cm deep, 2.3 to 2.95 kg; a toolbox 48.2 cm wide, 25 cm high and 25.4 cm deep, 1.5 kg; a suitcase's, a briefcase's and a toolbox's top handle bar 1.9 to 3.8 cm across.
 * 2. For three seeds of each of the three, the `handle` is 11.5 cm long, its bar's underside 5 cm above the body's top, its frame at the bar's centre.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each bag for 200 seeds and measures its body, its handle bar and its mass; a size other than the maker's, a seed that does not vary it, a bar off the NIOSH diameters, or a handle at another length or clearance is caught.
 * @evidence contracts/development/testing.md#independent-expectations Samsonite's and Rimowa's attaches, Stanley's toolbox, and the Applications Manual for the Revised NIOSH Lifting Equation's optimal handle, written here as literals.
 * @evidence contracts/development/testing.md#distinguishing-cases The two kinds the producer gained and the suitcase whose handle moved to the NIOSH handle; the tote and the backpack keep their straps and their own spec.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_props_bag_bands(): void {
  const bag = (
    kind: "suitcase" | "briefcase" | "toolbox",
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
  const findings: string[] = archetypeBandSweep([
    row("briefcase width", 0.415, 0.452, ATTACHE, (s: number): number =>
      archetypeExtent(bag("briefcase", s), "x", ["body"]).size,
    ),
    row("briefcase height", 0.35, 0.394, ATTACHE, (s: number): number =>
      archetypeExtent(bag("briefcase", s), "y", ["body"]).size,
    ),
    row("briefcase depth", 0.085, 0.147, ATTACHE, (s: number): number =>
      archetypeExtent(bag("briefcase", s), "z", ["body"]).size,
    ),
    row("briefcase mass", 2.3, 2.95, ATTACHE, (s: number): number =>
      bag("briefcase", s).body.mass,
    ),
    row("toolbox width", 0.482, 0.482, STANLEY, (s: number): number =>
      archetypeExtent(bag("toolbox", s), "x", ["body"]).size,
    ),
    row("toolbox height", 0.25, 0.25, STANLEY, (s: number): number =>
      archetypeExtent(bag("toolbox", s), "y", ["body"]).size,
    ),
    row("toolbox depth", 0.254, 0.254, STANLEY, (s: number): number =>
      archetypeExtent(bag("toolbox", s), "z", ["body"]).size,
    ),
    row("toolbox mass", 1.5, 1.5, STANLEY, (s: number): number =>
      bag("toolbox", s).body.mass,
    ),
    ...(["suitcase", "briefcase", "toolbox"] as const).map(
      (kind: "suitcase" | "briefcase" | "toolbox"): archetypeBandSweep.IRow =>
        row(`${kind} handle bar`, 0.019, 0.038, NIOSH, (s: number): number =>
          archetypeExtent(bag(kind, s), "z", ["handle"]).size,
        ),
    ),
  ]);
  for (const seed of [0, 1, 2])
    for (const kind of ["suitcase", "briefcase", "toolbox"] as const) {
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
  TestValidator.equals(
    "the briefcase, the toolbox and the top handles stay as cited",
    findings,
    [],
  );
}
