import { createTent } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/**
 * A relief family tent stands at UNHCR's specified size and weight, its doors where and as large as the specification gives them.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: its frame 4 m wide and 4 m long, its side walls 1.25 to 1.40 m high, 6.6 m from vestibule end to vestibule end, its ridge at 2.2 m within a roof slab's thickness, 49 to 53 kg.
 * 2. For three seeds, its outer doors are 1.3 m wide and 1.4 m high at the vestibules' ends, its inner doors 1 m wide and 1.75 m high at the frame's ends, each on the ground; its lowest point is on the ground.
 */
export function test_unit_archetypes_nature_nature_tent(): void {
  const tent = (seed: number): ReturnType<typeof createTent> =>
    createTent({ kind: "reliefFamily" }, seed);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source: "UNHCR Family Tent eco-design",
    measure,
  });
  const findings: string[] = archetypeBandSweep([
    row("width", 4, 4, (s: number): number =>
      archetypeExtent(tent(s), "x", ["walls"]).size,
    ),
    row("ridge", 4, 4, (s: number): number =>
      archetypeExtent(tent(s), "z", ["walls"]).size,
    ),
    row("wall", 1.25, 1.4, (s: number): number =>
      archetypeExtent(tent(s), "y", ["walls"]).size,
    ),
    row("base", 6.6, 6.6, (s: number): number =>
      archetypeExtent(tent(s), "z").size,
    ),
    row("mass", 49, 53, (s: number): number => tent(s).body.mass),
  ]);
  for (const seed of [0, 1, 2]) {
    const made: ReturnType<typeof createTent> = tent(seed);
    const top: number = archetypeExtent(made, "y").high;
    for (const [id, z, width, height] of [
      ["frontDoor", 3.3, 1.3, 1.4],
      ["backDoor", -3.3, 1.3, 1.4],
      ["frontInnerDoor", 2, 1, 1.75],
      ["backInnerDoor", -2, 1, 1.75],
    ] as const) {
      const door: ReturnType<typeof made.affordance> = made.affordance(id);
      if (
        Math.abs(door.frame.translation.z - z) > 1e-9 ||
        Math.abs(door.frame.translation.y) > 1e-12 ||
        Math.abs(door.width! - width) > 1e-12 ||
        Math.abs(door.height! - height) > 1e-12
      )
        findings.push(`tent@${seed}: ${id} is off its size or place`);
    }
    if (
      Math.abs(top - 2.2) > 4 * createTent.SLAB ||
      Math.abs(archetypeExtent(made, "y").low) > 1e-9
    )
      findings.push(`tent@${seed}: its ridge or footing is off`);
  }
  TestValidator.equals("the relief tent stays as UNHCR specifies it", findings, []);
}
