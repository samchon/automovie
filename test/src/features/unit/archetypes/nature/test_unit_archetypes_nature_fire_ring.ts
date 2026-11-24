import { AutoMovieArchetypeUnits, createFireRing } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/**
 * A campground fire ring stands at its maker's size and weight, its rim on its top edge and its fire on the ground at its centre.
 *
 * Scenarios:
 * 1. Over 200 seeds, at the maker's single figures: 30 in across its outside between opposite plates, 8 in high, 42 lb.
 * 2. Its wall is the 3/16 in plate between its outside and its inside along `+Z`; its `rim` is on the top edge at `+Z`, facing up; its `fire` on the ground at its centre, `+Y` up; its lowest point on the ground.
 */
export function test_unit_archetypes_nature_fire_ring(): void {
  const ring = (seed: number): ReturnType<typeof createFireRing> =>
    createFireRing({ kind: "campground" }, seed);
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const row = (
    name: string,
    value: number,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum: value,
    maximum: value,
    source: "Belson FR-30-GNG",
    measure,
  });
  const findings: string[] = archetypeBandSweep([
    row(
      "diameter",
      30 * inch,
      (s: number): number =>
        archetypeExtent(ring(s), "z", ["plate0", "plate8"]).size,
    ),
    row(
      "height",
      8 * inch,
      (s: number): number => archetypeExtent(ring(s), "y").size,
    ),
    row(
      "mass",
      42 * AutoMovieArchetypeUnits.POUND,
      (s: number): number => ring(s).body.mass,
    ),
  ]);
  const made: ReturnType<typeof createFireRing> = ring(0);
  const wall: ReturnType<typeof archetypeExtent> = archetypeExtent(made, "z", [
    "plate0",
  ]);
  const rim: ReturnType<typeof made.affordance> = made.affordance("rim");
  const fire: ReturnType<typeof made.affordance> = made.affordance("fire");
  if (
    Math.abs(wall.size - (3 / 16) * inch) > 1e-9 ||
    Math.abs(rim.frame.translation.y - 8 * inch) > 1e-9 ||
    !(
      rim.frame.translation.z > wall.low && rim.frame.translation.z < wall.high
    ) ||
    Math.abs(fire.frame.translation.x) > 1e-12 ||
    Math.abs(fire.frame.translation.y) > 1e-12 ||
    Math.abs(fire.frame.translation.z) > 1e-12 ||
    Math.abs(archetypeExtent(made, "y").low) > 1e-9
  )
    findings.push("the ring's wall, rim, fire or footing is off");
  TestValidator.equals(
    "the fire ring stays as its maker gives it",
    findings,
    [],
  );
}
