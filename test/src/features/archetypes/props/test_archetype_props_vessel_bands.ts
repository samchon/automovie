import { createVessel } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/** The bowls read: IKEA 365+'s and Thomas Sunny Day's 18 cm and cereal bowls. */
const BOWLS: string = "IKEA 365+ bowl and Thomas Sunny Day bowls";

/**
 * A vase stays inside its cited dimensions for every seed, measured on the produced thing, and is held round its middle; a bowl is one of its read models whole.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a vase's rim 30 cm up and its colliders 11.5 to 16 cm across.
 * 2. For three seeds, the vase's `body` grip is round its middle: its frame halfway up the rim, its width the vase's measured diameter.
 * 3. Each bowl model given by name is that bowl whole, its rim height, its measured diameter and its mass: IKEA 365+'s 7 by 16 cm at 0.44 kg packed, Thomas Sunny Day's 18 cm bowl 7.90 by 16.60 cm at 477 g and its cereal bowl 8.00 by 12.20 cm at 300 g; over 200 seeds a bowl's diameter spans 12.2 to 16.6 cm and its mass 300 to 477 g.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the vase and the bowl for 200 seeds and each bowl model by name, and measures their colliders, rim frames, grips and masses; a band other than the citation's, a seed that does not vary it, a vase held off its middle or at another width than its own, or a bowl between two models or off its read figures is caught.
 * @evidence contracts/development/testing.md#independent-expectations IKEA's BERÄKNA page and the TIDVATTEN and OMTÄNKSAM listings give the height and diameters; a hand round a vase's middle wraps its whole width; the bowls' figures are IKEA's and Thomas's pages.
 * @evidence contracts/development/testing.md#distinguishing-cases The vase and the bowl's three models; the other kinds are pinned by `test_archetype_everyday_placed`; the vase's mass is a packed weight left to the producer's provisional mark.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_props_vessel_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "vase rim",
      0.3,
      0.3,
      "IKEA BERÄKNA",
      (seed: number): number =>
        createVessel({ kind: "vase" }, seed).affordance("rim").frame.translation
          .y,
    ),
    row(
      "vase diameter",
      0.115,
      0.16,
      "IKEA BERÄKNA, TIDVATTEN and OMTÄNKSAM",
      (seed: number): number =>
        archetypeExtent(createVessel({ kind: "vase" }, seed), "x").size,
    ),
    row(
      "bowl diameter",
      0.122,
      0.166,
      BOWLS,
      (seed: number): number =>
        archetypeExtent(createVessel({ kind: "bowl" }, seed), "x").size,
    ),
    row(
      "bowl mass",
      0.3,
      0.477,
      BOWLS,
      (seed: number): number => createVessel({ kind: "bowl" }, seed).body.mass,
    ),
  ]);
  for (const [model, height, diameter, mass] of [
    ["ikea365", 0.07, 0.16, 0.44],
    ["sunnyDay18", 0.079, 0.166, 0.477],
    ["sunnyDayCereal", 0.08, 0.122, 0.3],
  ] as const) {
    const bowl: ReturnType<typeof createVessel> = createVessel({
      kind: "bowl",
      model,
    });
    if (
      Math.abs(bowl.affordance("rim").frame.translation.y - height) > 1e-9 ||
      Math.abs(archetypeExtent(bowl, "x").size - diameter) > 1e-9 ||
      Math.abs(bowl.body.mass - mass) > 1e-9
    )
      findings.push(`bowl ${model}: not its read figures`);
  }
  for (const seed of [0, 1, 2]) {
    const vase: ReturnType<typeof createVessel> = createVessel(
      { kind: "vase" },
      seed,
    );
    const body: ReturnType<typeof vase.affordance> = vase.affordance("body");
    if (
      Math.abs(
        body.frame.translation.y -
          vase.affordance("rim").frame.translation.y / 2,
      ) > 1e-9 ||
      Math.abs(body.aperture! - archetypeExtent(vase, "x").size) > 1e-9
    )
      findings.push(`vase@${seed}: not held round its middle`);
  }
  TestValidator.equals(
    "vases and bowls stay in their cited bands",
    findings,
    [],
  );
}
