import { createLongTool } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A fishing rod stays inside its maker's dimensions for every seed, measured on the produced thing, and is held at its butt and cast from its tip.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a rod 2.13 m long and 131 to 133 g.
 * 2. For three seeds, its `grip` is at its butt, its centre half the grip's length up the rod, and its `tip` at its top end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the rod for 200 seeds and measures its collider, frames and mass; a band other than the citation's, a seed that does not vary it, or a rod gripped off its butt or cast from off its end is caught.
 * @evidence contracts/development/testing.md#independent-expectations Daiwa's published length and weights; an angler holds a spinning rod at its butt and the line leaves its tip.
 * @evidence contracts/development/testing.md#distinguishing-cases The rod the producer gained; the broom, mop and shovel are pinned by the older band tests and their unchanged contract rows.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_props_longtool_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "rod length",
      2.13,
      2.13,
      "Daiwa Ninja X",
      (seed: number): number =>
        archetypeExtent(createLongTool({ kind: "fishingRod" }, seed), "y").size,
    ),
    row(
      "rod mass",
      0.131,
      0.133,
      "Daiwa Ninja X",
      (seed: number): number =>
        createLongTool({ kind: "fishingRod" }, seed).body.mass,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    const rod: ReturnType<typeof createLongTool> = createLongTool(
      { kind: "fishingRod" },
      seed,
    );
    const grip: ReturnType<typeof rod.affordance> = rod.affordance("grip");
    if (
      Math.abs(grip.frame.translation.y - grip.length! / 2) > 1e-12 ||
      Math.abs(
        rod.affordance("tip").frame.translation.y -
          archetypeExtent(rod, "y").high,
      ) > 1e-12
    )
      findings.push(`fishingRod@${seed}: the grip or the tip is off its end`);
  }
  TestValidator.equals("the fishing rod stays in its cited bands", findings, []);
}
