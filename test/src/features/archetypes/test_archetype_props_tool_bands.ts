import { ArchetypeFrame, createTool } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A ladle stays inside its makers' dimensions for every seed, measured on the produced thing, and works from its bowl.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a ladle 31 to 32 cm long with a 9 cm bowl, 218 g.
 * 2. For three seeds, its `face` looks `+Z` from its bowl's front.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the ladle for 200 seeds and measures its colliders, frame and mass; a band other than the citation's, a seed that does not vary it, or a face off its bowl is caught.
 * @evidence contracts/development/testing.md#independent-expectations Rösle's and IKEA's published figures; a ladle scoops with the open side of its bowl.
 * @evidence contracts/development/testing.md#distinguishing-cases The kind the producer gained; the older kinds belong to `test_archetype_props_bands` and `test_archetype_props_tableware_bands`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_props_tool_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "ladle length",
      0.31,
      0.32,
      "IKEA and Rösle",
      (seed: number): number =>
        archetypeExtent(createTool({ kind: "ladle" }, seed), "y").size,
    ),
    row(
      "ladle bowl",
      0.09,
      0.09,
      "Rösle",
      (seed: number): number =>
        archetypeExtent(createTool({ kind: "ladle" }, seed), "x", ["bowl"])
          .size,
    ),
    row(
      "ladle mass",
      0.218,
      0.218,
      "Rösle",
      (seed: number): number => createTool({ kind: "ladle" }, seed).body.mass,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    const ladle: ReturnType<typeof createTool> = createTool(
      { kind: "ladle" },
      seed,
    );
    const face: ReturnType<typeof ladle.affordance> = ladle.affordance("face");
    if (
      Math.abs(ArchetypeFrame.axis(face.frame, "y").z - 1) > 1e-12 ||
      Math.abs(
        face.frame.translation.z -
          archetypeExtent(ladle, "z", ["bowl"]).high,
      ) > 1e-9
    )
      findings.push(`ladle@${seed}: the face is off its bowl`);
  }
  TestValidator.equals("the ladle stays in its cited bands", findings, []);
}
