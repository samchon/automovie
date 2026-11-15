import { ArchetypeUnits, createCue } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A pool cue is the makers' 58 in, half butt and half shaft, its tip at McDermott's shaft diameters and its mass at the makers' 18 to 21 oz.
 *
 * Scenarios:
 * 1. The cue is 58 in long along `X`, its butt and shaft 29 in each.
 * 2. Over the seeds its butt is Viking's 1.205 to 1.295 in across, its tip 11.5 to 13.25 mm and its mass 18 to 21 oz; the `butt` handle's aperture is the butt's diameter.
 * 3. `tip` lies at the cue's `+X` end, `butt` and `shaft` at their halves' middles, each as long as its half.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds; a cue off its makers' length, tip or weight is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are McDermott's, Cuetec's and Viking's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases The two halves and the tip; a ranging tip and mass.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_cue(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const cue: ReturnType<typeof createCue> = createCue({}, 4);
  near("the cue's length", archetypeExtent(cue, "x").size, 58 * ArchetypeUnits.INCH);
  near("the butt", archetypeExtent(cue, "x", ["butt"]).size, 29 * ArchetypeUnits.INCH);
  near(
    "the shaft",
    archetypeExtent(cue, "x", ["shaft-back", "shaft-front"]).size,
    29 * ArchetypeUnits.INCH,
  );
  findings.push(
    ...archetypeBandSweep([
      {
        name: "cue butt",
        measure: (seed: number): number =>
          archetypeExtent(createCue({}, seed), "y", ["butt"]).size,
        minimum: 1.205 * ArchetypeUnits.INCH,
        maximum: 1.295 * ArchetypeUnits.INCH,
        source: "Viking skinny and average standard butts",
      },
      {
        name: "cue tip",
        measure: (seed: number): number => createCue({}, seed).dimensions.tip!,
        minimum: 0.0115,
        maximum: 0.01325,
        source: "McDermott shafts",
      },
      {
        name: "cue mass",
        measure: (seed: number): number => createCue({}, seed).body.mass,
        minimum: 18 * ArchetypeUnits.OUNCE,
        maximum: 21 * ArchetypeUnits.OUNCE,
        source: "Viking and McDermott",
      },
    ]),
  );
  near(
    "the butt's aperture",
    cue.affordance("butt").aperture!,
    archetypeExtent(cue, "y", ["butt"]).size,
  );
  const tip: IAutoMovieAffordance = cue.affordance("tip");
  near("the tip's place", tip.frame.translation.x, 29 * ArchetypeUnits.INCH);
  for (const [id, x] of [
    ["butt", -14.5 * ArchetypeUnits.INCH],
    ["shaft", 14.5 * ArchetypeUnits.INCH],
  ] as const) {
    near(`the ${id}'s middle`, cue.affordance(id).frame.translation.x, x);
    near(`the ${id}'s length`, cue.affordance(id).length!, 29 * ArchetypeUnits.INCH);
  }
  TestValidator.equals("a pool cue is the makers' cue", findings, []);
}
