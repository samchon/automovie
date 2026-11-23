import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  createBed,
  createSki,
} from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypeModelSweep } from "../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A ski is LINE Blend's shape at Rossignol's patented thickness, and a stretcher Stryker's Prime with its ComfortGel mattress.
 *
 * Scenarios:
 * 1. Over 200 seeds a ski is exactly one of LINE's 163, 169, 175 and 180 cm, each drawn, and 15 to 30 mm thick, its forebody and afterbody at the mean of LINE's 129-98-120 mm widths, its `stance` on its top 20 mm behind its centre. The two lower contacts lie along the drawn afterbody beside the boot.
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
    ...archetypeModelSweep([
      {
        name: "ski length",
        measure: (seed: number): readonly number[] => [
          archetypeExtent(createSki({}, seed), "z").size,
        ],
        models: [[1.63], [1.69], [1.75], [1.8]],
        source: "LINE Blend",
      },
    ]),
    ...archetypeBandSweep([
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
  near(
    "the forebody's width",
    archetypeExtent(ski, "x", ["forebody"]).size,
    (0.129 + 0.098) / 2,
  );
  near(
    "the afterbody's width",
    archetypeExtent(ski, "x", ["afterbody"]).size,
    (0.098 + 0.12) / 2,
  );
  near(
    "the stance behind the centre",
    ski.affordance("stance").frame.translation.z,
    0.02,
  );
  near(
    "the stance on the top",
    ski.affordance("stance").frame.translation.y,
    archetypeExtent(ski, "y").high,
  );
  for (const [id, sign] of [
    ["leftEdge", 1],
    ["rightEdge", -1],
  ] as const) {
    const edge: IAutoMovieAffordance = ski.affordance(id);
    const tangent: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      edge.frame,
      "x",
    );
    near(
      `${id} lies across from the boot on the afterbody boundary`,
      edge.frame.translation.x,
      (sign * (0.098 + 0.12)) / 4,
    );
    near(`${id} runs along the ski`, Math.abs(tangent.z), 1);
    const low: number = edge.frame.translation.z - edge.length! / 2;
    const high: number = edge.frame.translation.z + edge.length! / 2;
    if (low < -MM || high > archetypeExtent(ski, "z", ["afterbody"]).high + MM)
      findings.push(`${id} crosses an afterbody end: ${low}–${high}`);
  }

  // 2. The stretcher.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "stretcher surface",
        measure: (seed: number): number =>
          createBed({ kind: "gurney" }, seed).affordance("surface").frame
            .translation.y,
        minimum: 0.527 + 0.14,
        maximum: 0.864 + 0.14,
        source: "Stryker Prime and ComfortGel SE",
      },
    ]),
  );
  const gurney: ReturnType<typeof createBed> = createBed({ kind: "gurney" }, 3);
  near(
    "the patient surface's width",
    gurney.affordance("surface").width!,
    26 * AutoMovieArchetypeUnits.INCH,
  );
  near(
    "the patient surface's length",
    gurney.affordance("surface").depth!,
    75.25 * AutoMovieArchetypeUnits.INCH,
  );
  near(
    "the frame's length",
    archetypeExtent(gurney, "z").size,
    85 * AutoMovieArchetypeUnits.INCH,
  );
  near(
    "a caster's outer side",
    archetypeExtent(gurney, "x", ["caster-1"]).high,
    (26 * AutoMovieArchetypeUnits.INCH) / 2,
  );
  near(
    "a caster's outer end",
    archetypeExtent(gurney, "z", ["caster-1"]).high,
    (85 * AutoMovieArchetypeUnits.INCH) / 2,
  );
  near(
    "the casters' 8 in (20 cm)",
    archetypeExtent(gurney, "y", ["caster-1"]).size,
    0.2,
  );
  TestValidator.equals(
    "a ski and a stretcher stand at their sources",
    findings,
    [],
  );
}
