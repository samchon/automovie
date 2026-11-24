import { createStationery } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/**
 * A clipboard and a folded map are sized as their makers publish for every seed, measured on the produced thing, and are pinched at their edge and faced on their upper side.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a clipboard 232 by 349 mm and 3 mm thick, 168 to 190 g; a folded map 11 by 25 cm and 0.7 cm thick, 89 to 90 g.
 * 2. For three seeds of each, its `grip` is on its `+Z` edge, pinching its thickness along its whole width, its `face` on its upper side, and it lies on the floor.
 */
export function test_unit_archetypes_props_props_stationery_bands(): void {
  const make = (
    kind: "clipboard" | "map",
    seed: number,
  ): ReturnType<typeof createStationery> => createStationery({ kind }, seed);
  const findings: string[] = archetypeBandSweep(
    (
      [
        [
          "clipboard",
          "Esselte 56055 and 604037",
          0.232,
          0.349,
          0.003,
          [0.168, 0.19],
        ],
        ["map", "Michelin folded map", 0.11, 0.25, 0.007, [0.089, 0.09]],
      ] as const
    ).flatMap(
      ([
        kind,
        source,
        width,
        length,
        thickness,
        mass,
      ]): archetypeBandSweep.IRow[] => [
        {
          name: `${kind} width`,
          minimum: width,
          maximum: width,
          source,
          measure: (s: number): number =>
            archetypeExtent(make(kind, s), "x").size,
        },
        {
          name: `${kind} length`,
          minimum: length,
          maximum: length,
          source,
          measure: (s: number): number =>
            archetypeExtent(make(kind, s), "z").size,
        },
        {
          name: `${kind} thickness`,
          minimum: thickness,
          maximum: thickness,
          source,
          measure: (s: number): number =>
            make(kind, s).affordance("grip").aperture!,
        },
        {
          name: `${kind} mass`,
          minimum: mass[0],
          maximum: mass[1],
          source,
          measure: (s: number): number => make(kind, s).body.mass,
        },
      ],
    ),
  );
  for (const seed of [0, 1, 2])
    for (const kind of ["clipboard", "map"] as const) {
      const slab: ReturnType<typeof createStationery> = make(kind, seed);
      const grip: ReturnType<typeof slab.affordance> = slab.affordance("grip");
      const face: ReturnType<typeof slab.affordance> = slab.affordance("face");
      if (
        Math.abs(grip.frame.translation.z - archetypeExtent(slab, "z").high) >
          1e-9 ||
        Math.abs(grip.aperture! - archetypeExtent(slab, "y").size) > 1e-9 ||
        Math.abs(grip.length! - archetypeExtent(slab, "x").size) > 1e-9 ||
        Math.abs(face.frame.translation.y - archetypeExtent(slab, "y").high) >
          1e-9 ||
        Math.abs(archetypeExtent(slab, "y").low) > 1e-12
      )
        findings.push(
          `${kind}@${seed}: the grip, the face or its resting is off`,
        );
    }
  TestValidator.equals(
    "the clipboard and the map stay as published",
    findings,
    [],
  );
}
