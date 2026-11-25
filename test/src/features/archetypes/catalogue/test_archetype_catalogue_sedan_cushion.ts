import { createCar } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { nclose } from "../../internal/nclose";

/** Equality tolerance for box extents and affordance coordinates in metres. */
const ROUNDING: number = 1e-9;

/** The collider of the driver's cushion. */
const CUSHION: readonly string[] = ["cushion-driver"];

/**
 * A seeded sedan locates its driving seat on the actual cushion.
 *
 * Scenarios:
 * 1. Compare the driver's affordance with the collider's front edge and width.
 * 2. Verify the seat-height provenance and variation over the two seed ranges.
 */
export function test_archetype_catalogue_sedan_cushion(): void {
  for (const first of [0, 100]) {
    const heights: number[] = [];
    for (let seed: number = first; seed < first + 100; ++seed) {
      const car: ReturnType<typeof createCar> = createCar(
        { kind: "sedan" },
        seed,
      );
      const shapes: ReturnType<typeof car.shapes> = car.shapes();
      const x: ReturnType<typeof archetypeExtent> = archetypeExtent(
        shapes,
        "x",
        CUSHION,
      );
      const y: ReturnType<typeof archetypeExtent> = archetypeExtent(
        shapes,
        "y",
        CUSHION,
      );
      const z: ReturnType<typeof archetypeExtent> = archetypeExtent(
        shapes,
        "z",
        CUSHION,
      );
      const seat: ReturnType<typeof car.affordance> =
        car.affordance("driverSeat");
      const height: number | undefined = car.dimensions.seatHeight;
      const band: (typeof car.provenance.bands)["seatHeight"] =
        car.provenance.bands.seatHeight;
      TestValidator.predicate(
        `sedan seed ${seed} publishes the middle of its cushion's front edge`,
        nclose(seat.frame.translation.x, (x.low + x.high) / 2, ROUNDING) &&
          nclose(seat.frame.translation.y, y.high, ROUNDING) &&
          nclose(seat.frame.translation.z, z.high, ROUNDING) &&
          seat.width !== undefined &&
          nclose(seat.width, x.size, ROUNDING) &&
          seat.depth !== undefined &&
          nclose(seat.depth, z.size, ROUNDING),
      );
      TestValidator.predicate(
        `sedan seed ${seed} retains a source for the actual seat height`,
        height !== undefined &&
          (band === undefined
            ? car.provenance.figures.seatHeight !== undefined
            : height >= band.minimum &&
              height <= band.maximum &&
              band.source.length > 0),
      );
      heights.push(y.high);
    }
    TestValidator.predicate(
      `sedan seeds ${first} through ${first + 99} vary the cushion height`,
      Math.max(...heights) > Math.min(...heights),
    );
  }
}
