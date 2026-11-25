import { AutoMovieArchetypeUnits, createCue } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A pool cue is the makers' 58 in, half butt and half shaft, its butt one of Viking's, its tip one of McDermott's shaft diameters and its mass at the makers' 18 to 21 oz.
 *
 * Scenarios:
 * 1. The cue is 58 in long along `X`, its butt and shaft 29 in each.
 * 2. Over 200 seeds its butt is exactly one of Viking's 1.205, 1.25 and 1.295 in and its tip one of McDermott's 11.5, 12, 12.5 and 13 mm, every pairing drawn, the tip read off the front half of the shaft, whose diameter is the mean of the butt's and three tips'; its mass is 18 to 21 oz; the `butt` handle's aperture is the butt's diameter.
 * 3. `tip` lies at the cue's `+X` end, `butt` and `shaft` at their halves' middles, each as long as its half.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds; a cue off its makers' length, tip or weight is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are McDermott's, Cuetec's and Viking's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases The two halves and the tip; a picked butt and tip, and a ranging mass.
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
  near(
    "the cue's length",
    archetypeExtent(cue, "x").size,
    58 * AutoMovieArchetypeUnits.INCH,
  );
  near(
    "the butt",
    archetypeExtent(cue, "x", ["butt"]).size,
    29 * AutoMovieArchetypeUnits.INCH,
  );
  near(
    "the shaft",
    archetypeExtent(cue, "x", ["shaft-back", "shaft-front"]).size,
    29 * AutoMovieArchetypeUnits.INCH,
  );
  findings.push(
    ...archetypeModelSweep([
      {
        name: "cue butt and tip",
        measure: (seed: number): readonly number[] => {
          const drawn: ReturnType<typeof createCue> = createCue({}, seed);
          const butt: number = archetypeExtent(drawn, "y", ["butt"]).size;
          const front: number = archetypeExtent(drawn, "y", [
            "shaft-front",
          ]).size;
          return [butt, (4 * front - butt) / 3];
        },
        models: [1.205, 1.25, 1.295].flatMap((inch: number): number[][] =>
          [11.5, 12, 12.5, 13].map((mm: number): number[] => [
            inch * AutoMovieArchetypeUnits.INCH,
            mm * AutoMovieArchetypeUnits.MILLIMETRE,
          ]),
        ),
        source: "Viking butts and McDermott shafts",
      },
    ]),
    ...archetypeBandSweep([
      {
        name: "cue mass",
        measure: (seed: number): number => createCue({}, seed).body.mass,
        minimum: 18 * AutoMovieArchetypeUnits.OUNCE,
        maximum: 21 * AutoMovieArchetypeUnits.OUNCE,
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
  near(
    "the tip's place",
    tip.frame.translation.x,
    29 * AutoMovieArchetypeUnits.INCH,
  );
  for (const [id, x] of [
    ["butt", -14.5 * AutoMovieArchetypeUnits.INCH],
    ["shaft", 14.5 * AutoMovieArchetypeUnits.INCH],
  ] as const) {
    near(`the ${id}'s middle`, cue.affordance(id).frame.translation.x, x);
    near(
      `the ${id}'s length`,
      cue.affordance(id).length!,
      29 * AutoMovieArchetypeUnits.INCH,
    );
  }
  TestValidator.equals("a pool cue is the makers' cue", findings, []);
}
