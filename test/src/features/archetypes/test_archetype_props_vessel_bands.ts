import { createVessel } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A vase stays inside its cited dimensions for every seed, measured on the produced thing, and is held round its middle.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a vase's rim 30 cm up and its colliders 11.5 to 16 cm across.
 * 2. For three seeds, the vase's `body` grip is round its middle: its frame halfway up the rim, its width the vase's measured diameter.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the vase for 200 seeds and measures its colliders, rim frame and grip; a band other than the citation's, a seed that does not vary it, or a vase held off its middle or at another width than its own is caught.
 * @evidence contracts/development/testing.md#independent-expectations IKEA's BERÄKNA page and the TIDVATTEN and OMTÄNKSAM listings give the height and diameters; a hand round a vase's middle wraps its whole width.
 * @evidence contracts/development/testing.md#distinguishing-cases The kind the vessel gained; the older four are pinned by `test_archetype_everyday_placed`; the mass is a packed weight left to the producer's provisional mark.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
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
  ]);
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
  TestValidator.equals("the vase stays in its cited bands", findings, []);
}
