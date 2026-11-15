import { createBed, createSki } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A ski is LINE Blend's shape at Rossignol's patented thickness, and a stretcher Stryker's Prime with its ComfortGel mattress.
 *
 * Scenarios:
 * 1. A ski is 1.63 to 1.80 m long and 15 to 30 mm thick, its forebody and afterbody at the mean of LINE's 129-98-120 mm widths, its `stance` on its top 20 mm behind its centre.
 * 2. A stretcher's surface lies the ComfortGel's 5.5 in over a litter in the Prime's 20.75 to 34 in, its patient surface 26 x 75.25 in and its frame 85 in long, its 8 in casters at the corners of its 85 x 26 in overall size.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds; a ski or a stretcher off its sources is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are LINE's, Rossignol's and Stryker's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases A board lying flat and a raised bed.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_ski_gurney(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The ski.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "ski length",
        measure: (seed: number): number =>
          archetypeExtent(createSki({}, seed), "z").size,
        minimum: 1.63,
        maximum: 1.8,
        source: "LINE Blend",
      },
      {
        name: "ski thickness",
        measure: (seed: number): number =>
          archetypeExtent(createSki({}, seed), "y").size,
        minimum: 0.015,
        maximum: 0.03,
        source: "Rossignol EP0806228A1",
      },
    ]),
  );
  const ski: ReturnType<typeof createSki> = createSki({}, 3);
  near("the forebody's width", archetypeExtent(ski, "x", ["forebody"]).size, (0.129 + 0.098) / 2);
  near("the afterbody's width", archetypeExtent(ski, "x", ["afterbody"]).size, (0.098 + 0.12) / 2);
  near("the stance behind the centre", ski.affordance("stance").frame.translation.z, 0.02);
  near("the stance on the top", ski.affordance("stance").frame.translation.y, archetypeExtent(ski, "y").high);

  // 2. The stretcher.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "stretcher surface",
        measure: (seed: number): number =>
          createBed({ kind: "gurney" }, seed).affordance("surface").frame
            .translation.y,
        minimum: 0.527 + 0.1397,
        maximum: 0.864 + 0.1397,
        source: "Stryker Prime and ComfortGel SE",
      },
    ]),
  );
  const gurney: ReturnType<typeof createBed> = createBed({ kind: "gurney" }, 3);
  near("the patient surface's width", gurney.affordance("surface").width!, 0.6604);
  near("the patient surface's length", gurney.affordance("surface").depth!, 1.9114);
  near("the frame's length", archetypeExtent(gurney, "z").size, 2.159);
  near("a caster's outer side", archetypeExtent(gurney, "x", ["caster-1"]).high, 0.6604 / 2);
  near("a caster's outer end", archetypeExtent(gurney, "z", ["caster-1"]).high, 2.159 / 2);
  near("the casters' 8 in", archetypeExtent(gurney, "y", ["caster-1"]).size, 0.2032);
  TestValidator.equals(
    "a ski and a stretcher stand at their sources",
    findings,
    [],
  );
}
