import {
  AutoMovieArchetypeEscalator
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Allows the transition trigonometry and accumulated distances in metres. */
const STATION_ROUNDING: number = 128 * Number.EPSILON;

/** The tread band closes its rise between unequal circles and two flat combs. */
export function test_archetypes_architecture_escalator_stations(): void {
  const rise: number = 7 - (5 * Math.sqrt(3)) / 2;
  const dimensions: Parameters<
    typeof AutoMovieArchetypeEscalator.profile
  >[0]["dimensions"] = {
    rise,
    incline: 30,
    lowerRadius: 2,
    upperRadius: 3,
    level: 2,
    speed: 0.5,
    handrail: 1,
    width: 1,
  };
  const band = AutoMovieArchetypeEscalator.profile({ dimensions });
  const run: number = 1.6 + (5 * Math.PI) / 6 + 4;
  const upperComb: number = 4.1 + 2 * Math.sqrt(3);
  TestValidator.predicate(
    "four metres of straight track supply two metres missing from the transition rises",
    nclose(band.straight, 4, STATION_ROUNDING) &&
      nclose(band.length, run, STATION_ROUNDING),
  );
  const rows: readonly [number, number, number][] = [
    [-0.25, -0.25, 0],
    [0.4, 0, 0.4],
    [0.8 + Math.PI / 3, 2 - Math.sqrt(3), 1.8],
    [0.8 + Math.PI / 3 + 2, 3 - Math.sqrt(3), 1.8 + Math.sqrt(3)],
    [run - 0.8, rise, upperComb - 0.8],
    [run - 0.4, rise, upperComb - 0.4],
    [run + 0.25, rise - 0.25, upperComb],
  ];
  for (const [distance, y, z] of rows)
    TestValidator.predicate(
      `tread position at ${distance} m from the lower comb`,
      vclose(
        AutoMovieArchetypeEscalator.station(band, distance),
        { x: 0, y, z },
        STATION_ROUNDING,
      ),
    );
  TestValidator.error("the transitions cannot overlap", (): unknown =>
    AutoMovieArchetypeEscalator.profile({ dimensions: { ...dimensions, rise: 0.5 } }),
  );
}
