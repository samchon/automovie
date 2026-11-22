import { AutoMovieArchetypeFrame, createTool } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A ladle and a table knife stay inside their makers' dimensions for every seed, measured on the produced thing, and work from their bowl and their edge.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a ladle 32 cm long with a 9 cm bowl, 218 g; a table knife 22.5 to 24.6 cm long, its blade 12 to 12.5 cm long and 17 to 21 mm from spine to edge, 60 to 130 g.
 * 2. For three seeds, the ladle's `face` looks `+Z` from its bowl's front, and the knife's `face` runs along its blade's edge at `+Z`, as long as the blade, looking `+Z`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the ladle for 200 seeds and measures its colliders, frame and mass; a band other than the citation's, a seed that does not vary it, a face off its bowl or off the knife's edge is caught.
 * @evidence contracts/development/testing.md#independent-expectations Rösle's, Eichenlaub's and Robert Welch's published figures; a ladle scoops with the open side of its bowl and a knife cuts with its edge.
 * @evidence contracts/development/testing.md#distinguishing-cases The kinds the producer gained; the older kinds belong to `test_archetype_props_bands` and `test_archetype_props_tableware_bands`.
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
      0.32,
      0.32,
      "Rösle",
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
    row(
      "knife length",
      0.225,
      0.246,
      "Eichenlaub and Robert Welch",
      (seed: number): number =>
        archetypeExtent(createTool({ kind: "knife" }, seed), "y").size,
    ),
    row(
      "knife blade",
      0.12,
      0.125,
      "Eichenlaub and Robert Welch",
      (seed: number): number =>
        archetypeExtent(createTool({ kind: "knife" }, seed), "y", ["blade"])
          .size,
    ),
    row(
      "knife blade width",
      0.017,
      0.021,
      "Eichenlaub and Robert Welch",
      (seed: number): number =>
        archetypeExtent(createTool({ kind: "knife" }, seed), "z", ["blade"])
          .size,
    ),
    row(
      "knife mass",
      0.06,
      0.13,
      "Eichenlaub and Robert Welch",
      (seed: number): number => createTool({ kind: "knife" }, seed).body.mass,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    const ladle: ReturnType<typeof createTool> = createTool(
      { kind: "ladle" },
      seed,
    );
    const face: ReturnType<typeof ladle.affordance> = ladle.affordance("face");
    if (
      Math.abs(AutoMovieArchetypeFrame.axis(face.frame, "y").z - 1) > 1e-12 ||
      Math.abs(
        face.frame.translation.z - archetypeExtent(ladle, "z", ["bowl"]).high,
      ) > 1e-9
    )
      findings.push(`ladle@${seed}: the face is off its bowl`);
    const knife: ReturnType<typeof createTool> = createTool(
      { kind: "knife" },
      seed,
    );
    const edge: ReturnType<typeof knife.affordance> = knife.affordance("face");
    if (
      Math.abs(AutoMovieArchetypeFrame.axis(edge.frame, "y").z - 1) > 1e-12 ||
      Math.abs(
        edge.frame.translation.z - archetypeExtent(knife, "z", ["blade"]).high,
      ) > 1e-9 ||
      Math.abs(edge.length! - archetypeExtent(knife, "y", ["blade"]).size) >
        1e-9
    )
      findings.push(`knife@${seed}: the face is off its edge`);
  }
  TestValidator.equals(
    "the ladle and the knife stay in their cited bands",
    findings,
    [],
  );
}
