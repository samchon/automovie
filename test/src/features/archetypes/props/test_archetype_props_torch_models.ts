import { AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal, AutoMovieArchetypeTorch } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/** Maglite's two torches read. */
const MAGLITE: string = "Maglite 2-Cell and 3-Cell D LED";

/**
 * A flashlight is one of Maglite's torches whole, measured on the produced thing, and shines along its length from its head.
 *
 * Scenarios:
 * 1. Each model given by name is that torch whole: the 2-Cell D LED 254 mm long at 674 g and the 3-Cell D LED 313 mm long at 856 g, each with its 39.67 mm barrel as its grip's width and its 57 mm head.
 * 2. Over 200 seeds the torch spans both models, 254 to 313 mm long and 674 to 856 g.
 * 3. For each model, the `lens` is the top of the head with `+Y` up the torch, the beam's axis, and the `grip` runs along the barrel below the head.
 * 4. A length fixed by the author, one of a model's own figures, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies both flashlight catalogue models, their lens and grip locations, and the fixed model-figure refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Measures named and seeded models' colliders, weights and frames. The sweep must reach both complete catalogue models. A fixed length conflicts with the catalogue selection.
 * @evidence contracts/development/testing.md#independent-expectations Uses Maglite's 254 and 313 mm lengths, 674 and 856 g masses, 39.67 mm barrel diameter and 57 mm head diameter. The lens beam follows the head's longitudinal axis.
 */
export function test_archetype_props_torch_models(): void {
  const findings: string[] = archetypeBandSweep([
    {
      name: "torch length",
      minimum: 0.254,
      maximum: 0.313,
      source: MAGLITE,
      measure: (seed: number): number =>
        archetypeExtent(AutoMovieArchetypeTorch.create({}, seed), "y").size,
    },
    {
      name: "torch mass",
      minimum: 0.674,
      maximum: 0.856,
      source: MAGLITE,
      measure: (seed: number): number => AutoMovieArchetypeTorch.create({}, seed).body.mass,
    },
  ]);
  for (const [model, length, mass] of [
    ["twoCellD", 0.254, 0.674],
    ["threeCellD", 0.313, 0.856],
  ] as const) {
    const torch: ReturnType<typeof AutoMovieArchetypeTorch.create> = AutoMovieArchetypeTorch.create({ model });
    const grip: ReturnType<typeof torch.affordance> = torch.affordance("grip");
    const lens: ReturnType<typeof torch.affordance> = torch.affordance("lens");
    const head: ReturnType<typeof archetypeExtent> = archetypeExtent(
      torch,
      "y",
      ["head"],
    );
    if (
      Math.abs(archetypeExtent(torch, "y").size - length) > 1e-9 ||
      Math.abs(torch.body.mass - mass) > 1e-9 ||
      Math.abs(grip.aperture! - 0.03967) > 1e-9 ||
      Math.abs(archetypeExtent(torch, "x", ["head"]).size - 0.057) > 1e-9
    )
      findings.push(`${model}: not its read figures`);
    if (
      Math.abs(lens.frame.translation.y - head.high) > 1e-9 ||
      Math.abs(AutoMovieArchetypeFrame.axis(lens.frame, "y").y - 1) > 1e-12 ||
      grip.frame.translation.y > head.low ||
      Math.abs(Math.abs(AutoMovieArchetypeFrame.axis(grip.frame, "x").y) - 1) >
        1e-12
    )
      findings.push(`${model}: the beam or the grip is off`);
  }
  let refused: unknown = null;
  try {
    AutoMovieArchetypeTorch.create({ length: 0.254 });
  } catch (error) {
    refused = error;
  }
  if (
    !(refused instanceof AutoMovieArchetypeRefusal && refused.axis === "length")
  )
    findings.push("a fixed length, a model's own figure, is not refused");
  TestValidator.equals("a flashlight is one of its models", findings, []);
}
