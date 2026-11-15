import { createCar, type IArchetypeBand } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A van and a pickup are drawn inside their makers' bands and built at the sizes they drew.
 *
 * Scenarios, for the van and the pickup over 200 seeds each:
 * 1. Every drawn dimension lies inside its band.
 * 2. The built car measures what it drew: its length along `Z` and its height along `Y` over all parts within 1 cm, its wheelbase between the wheel centres within 1 mm.
 * 3. The van's sliding opening is `sideDoorWidth` by `sideDoorHeight` at the side step, its cargo floor at `cargoFloor`, the cargo floor `loadLength` deep to the bulkhead; the pickup's bed floor is at `bedFloor`, `bedWidth` wide and `bedLength` long, and its tailgate stands `bedDepth` tall; each within 1 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the cars and measures their parts and affordances; a dimension drawn outside its band, a body built at another size than drawn, or an opening or floor misplaced is caught.
 * @evidence contracts/development/testing.md#independent-expectations The bands are the makers' sheets (Ford Transit Custom 2023, Ford Ranger 2025) as `CAR_BANDS` cites them; the measures are taken on the built parts, not read from the producer's layout.
 * @evidence contracts/development/testing.md#distinguishing-cases The two new classes, every dimension each has; the sedan's and hatchback's bands belong to `test_archetype_ride_bands`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_car_kinds_bands(): void {
  const findings: string[] = [];
  for (const kind of ["van", "pickup"] as const) {
    const bands: Readonly<Partial<Record<createCar.Dimension, IArchetypeBand>>> = createCar.BANDS[kind];
    for (let seed: number = 0; seed < 200; seed++) {
      const car: ReturnType<typeof createCar> = createCar({ kind }, seed);
      const d: Readonly<Partial<Record<createCar.Dimension, number>>> = car.dimensions;
      const label: string = `${kind}@${seed}`;

      // 1. Inside the bands.
      for (const [name, band] of Object.entries(bands) as [createCar.Dimension, IArchetypeBand][]) {
        const value: number | undefined = d[name];
        if (value === undefined || value < band.minimum || value > band.maximum)
          findings.push(`${label}: ${name} ${value} outside ${band.minimum} to ${band.maximum}`);
      }

      // 2. Built at the drawn size.
      const z: { low: number; high: number } = archetypeExtent(car, "z");
      const y: { low: number; high: number } = archetypeExtent(car, "y");
      const wheel = (id: string): number =>
        car.parts.find((p: IAutoMovieModelPart): boolean => p.id === id)!.transform!.translation.z;
      if (Math.abs(z.high - z.low - d.length!) > 0.01) findings.push(`${label}: length ${z.high - z.low}, drawn ${d.length}`);
      if (Math.abs(y.high - y.low - d.height!) > 0.01) findings.push(`${label}: height ${y.high - y.low}`);
      if (Math.abs(wheel("wheel-front-left") - wheel("wheel-rear-left") - d.wheelbase!) > 1e-3)
        findings.push(`${label}: wheelbase`);

      // 3. The openings and floors.
      const close = (a: number, b: number, what: string): void => {
        if (Math.abs(a - b) > 1e-3) findings.push(`${label}: ${what} ${a}, not ${b}`);
      };
      if (kind === "van") {
        const opening: IAutoMovieAffordance = car.affordance("slidingAperture");
        close(opening.width!, d.sideDoorWidth!, "sliding opening width");
        close(opening.height!, d.sideDoorHeight!, "sliding opening height");
        close(opening.frame.translation.y, d.sideStep!, "sliding opening sill");
        const cargo: IAutoMovieAffordance = car.affordance("cargo");
        close(cargo.frame.translation.y, d.cargoFloor!, "cargo floor");
        const floor: { low: number; high: number } = archetypeExtent(car, "z", ["cargo-floor"]);
        const bulkhead: { low: number; high: number } = archetypeExtent(car, "z", ["bulkhead"]);
        const doors: { low: number; high: number } = archetypeExtent(car, "z", ["rear-doors"]);
        close(bulkhead.low - doors.high, d.loadLength!, "load length");
        close(floor.high, bulkhead.low, "cargo floor's front");
      } else {
        const bed: IAutoMovieAffordance = car.affordance("bed");
        close(bed.frame.translation.y, d.bedFloor!, "bed floor");
        close(bed.width!, d.bedWidth!, "bed width");
        close(bed.depth!, d.bedLength!, "bed length");
        const tailgate: { low: number; high: number } = archetypeExtent(car, "y", ["tailgate"]);
        close(tailgate.high - tailgate.low, d.bedDepth!, "tailgate height");
      }
    }
  }

  TestValidator.equals("a van and a pickup are their makers' sizes", findings, []);
}
