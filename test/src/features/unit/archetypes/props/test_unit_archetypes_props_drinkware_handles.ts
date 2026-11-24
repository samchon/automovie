import { createDrinkware } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/**
 * A mug's and a cup's handle loop admits an index and a middle finger, and a cup is sized as its maker publishes.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a cup 90 mm across and 55 mm high, 180 g; for a mug and a cup, the loop's inside 32.58 to 35.91 mm tall between its stubs, the women's to the men's index and middle breadths side by side, and 24.9 to 26.8 mm deep from the body to the bar, the thicker finger's depth; the bar 8 to 16 mm, the industrial-handle analogue.
 * 2. For three seeds of each, the `handle` is a hook grip on the bar, its length the loop's inside, and the handle's lowest point is not below the base.
 */
export function test_unit_archetypes_props_drinkware_handles(): void {
  const vessel = (
    kind: "mug" | "cup",
    seed: number,
  ): ReturnType<typeof createDrinkware> => createDrinkware({ kind }, seed);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const FINGERS: string = "Rastgoo Balov et al. 2026";
  const CUP: string = "BHS tabletop SMART cup";
  const findings: string[] = archetypeBandSweep([
    row("cup diameter", 0.09, 0.09, CUP, (s: number): number =>
      archetypeExtent(vessel("cup", s), "z", ["body"]).size,
    ),
    row("cup height", 0.055, 0.055, CUP, (s: number): number =>
      archetypeExtent(vessel("cup", s), "y", ["body"]).size,
    ),
    row("cup mass", 0.18, 0.18, CUP, (s: number): number =>
      vessel("cup", s).body.mass,
    ),
    ...(["mug", "cup"] as const).flatMap(
      (kind: "mug" | "cup"): archetypeBandSweep.IRow[] => [
        row(`${kind} loop height`, 0.03258, 0.03591, FINGERS, (s: number): number => {
          const made: ReturnType<typeof createDrinkware> = vessel(kind, s);
          return (
            archetypeExtent(made, "y", ["handle-high"]).low -
            archetypeExtent(made, "y", ["handle-low"]).high
          );
        }),
        row(
          `${kind} loop depth`,
          Math.sqrt(0.05928 ** 2 / 4 - 0.0161 ** 2),
          Math.sqrt(0.06445 ** 2 / 4 - 0.01793 ** 2),
          FINGERS,
          (s: number): number => {
            const made: ReturnType<typeof createDrinkware> = vessel(kind, s);
            return (
              archetypeExtent(made, "x", ["handle"]).low -
              archetypeExtent(made, "x", ["body"]).high
            );
          },
        ),
        row(`${kind} bar`, 0.008, 0.016, "Elesa+Ganter GN 425", (s: number): number =>
          archetypeExtent(vessel(kind, s), "z", ["handle"]).size,
        ),
      ],
    ),
  ]);
  for (const seed of [0, 1, 2])
    for (const kind of ["mug", "cup"] as const) {
      const made: ReturnType<typeof createDrinkware> = vessel(kind, seed);
      const handle: ReturnType<typeof made.affordance> =
        made.affordance("handle");
      const loop: number =
        archetypeExtent(made, "y", ["handle-high"]).low -
        archetypeExtent(made, "y", ["handle-low"]).high;
      if (
        handle.grip !== "hook" ||
        Math.abs(handle.length! - loop) > 1e-9 ||
        archetypeExtent(made, "y", ["handle-low"]).low < -1e-12
      )
        findings.push(`${kind}@${seed}: the handle is not the fingers' loop`);
    }
  TestValidator.equals(
    "the mug's and the cup's handles admit the fingers",
    findings,
    [],
  );
}
