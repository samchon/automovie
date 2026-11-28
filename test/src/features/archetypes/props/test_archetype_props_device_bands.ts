import { AutoMovieArchetypeDevice } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/** Apple's tablet specification. */
const IPAD: string = "Apple iPad (10th generation)";

/** Motorola's portable radio data sheet. */
const RADIO: string = "Motorola MOTOTRBO CP200d";

/**
 * A tablet and a walkie-talkie are sized as their makers publish for every seed, measured on the produced thing, and are held and faced where their slab is.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a tablet 248.6 mm high, 179.5 mm wide, 7 mm thick, 477 to 481 g; a walkie-talkie 127.7 mm high, 61.5 mm wide, 39 to 44 mm thick, 341 to 406 g.
 * 2. For three seeds of each, its `grip` is at the slab's middle across its thickness, and its `screen` or `speaker` covers its whole front, facing `+Z`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both device dimensions, mass ranges and the distinction between a screen and speaker face.
 * @evidence contracts/development/testing.md#behavioral-verification Measures actual built tablet and radio colliders and body masses over 200 seeds. Model-local frames must put the across-thickness grip at the midplane and aim the working face forward.
 * @evidence contracts/development/testing.md#independent-expectations Uses Apple's 248.6 by 179.5 by 7 mm slab and Motorola's 127.7 by 61.5 mm face and measured thickness range, plus their stated mass ranges. The slab grip reference is the centre between front and back.
 */
export function test_archetype_props_device_bands(): void {
  const device = (
    kind: "tablet" | "walkieTalkie",
    seed: number,
  ): ReturnType<typeof AutoMovieArchetypeDevice.create> => AutoMovieArchetypeDevice.create({ kind }, seed);
  const findings: string[] = archetypeBandSweep(
    (
      [
        ["tablet", IPAD, 0.2486, 0.1795, [0.007, 0.007], [0.477, 0.481]],
        ["walkieTalkie", RADIO, 0.1277, 0.0615, [0.039, 0.044], [0.341, 0.406]],
      ] as const
    ).flatMap(
      ([
        kind,
        source,
        height,
        width,
        thickness,
        mass,
      ]): archetypeBandSweep.IRow[] => [
        {
          name: `${kind} height`,
          minimum: height,
          maximum: height,
          source,
          measure: (s: number): number =>
            archetypeExtent(device(kind, s), "y").size,
        },
        {
          name: `${kind} width`,
          minimum: width,
          maximum: width,
          source,
          measure: (s: number): number =>
            archetypeExtent(device(kind, s), "x").size,
        },
        {
          name: `${kind} thickness`,
          minimum: thickness[0],
          maximum: thickness[1],
          source,
          measure: (s: number): number =>
            archetypeExtent(device(kind, s), "z").size,
        },
        {
          name: `${kind} mass`,
          minimum: mass[0],
          maximum: mass[1],
          source,
          measure: (s: number): number => device(kind, s).body.mass,
        },
      ],
    ),
  );
  for (const seed of [0, 1, 2])
    for (const [kind, face] of [
      ["tablet", "screen"],
      ["walkieTalkie", "speaker"],
    ] as const) {
      const slab: ReturnType<typeof AutoMovieArchetypeDevice.create> = device(kind, seed);
      const grip: ReturnType<typeof slab.affordance> = slab.affordance("grip");
      const front: ReturnType<typeof slab.affordance> = slab.affordance(face);
      if (
        Math.abs(
          grip.frame.translation.y - archetypeExtent(slab, "y").size / 2,
        ) > 1e-9 ||
        Math.abs(grip.aperture! - archetypeExtent(slab, "z").size) > 1e-9 ||
        Math.abs(front.frame.translation.z - archetypeExtent(slab, "z").high) >
          1e-9 ||
        Math.abs(front.width! - archetypeExtent(slab, "x").size) > 1e-9 ||
        Math.abs(front.depth! - archetypeExtent(slab, "y").size) > 1e-9
      )
        findings.push(
          `${kind}@${seed}: the grip or the ${face} is off its slab`,
        );
    }
  TestValidator.equals(
    "the tablet and the walkie-talkie stay as published",
    findings,
    [],
  );
}
