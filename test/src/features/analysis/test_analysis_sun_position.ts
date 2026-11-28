import { AutoMovieEngineEnvironment } from "@automovie/engine";
import type {
  IAutoMovieSolveSunPosition,
  IAutoMovieSunPosition,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Solve the sun's topocentric position against the published example of the
 * solar position report and against the geometry of an equinox at the equator.
 *
 * Scenarios:
 *
 * 1. The Reda and Andreas 2004 example site (39.742476 N, 105.1786 W, 1830.14 m,
 *    820 mbar, 11 C, 2003-10-17 19:30:30 UTC) gives zenith 50.11162 and azimuth
 *    194.34024 within 0.02 degrees, and elevation is 90 minus zenith.
 * 2. At 0 N 0 E on 2025-03-20 12:00 UTC the zenith is below 3 degrees: the
 *    declination is near zero at the equinox and the equation of time leaves
 *    the hour angle near -1.9 degrees.
 * 3. At the same site at 18:47 UTC the sun is about 10 degrees below the horizon:
 *    its elevation is negative and halving the pressure leaves it unchanged, so
 *    no refraction was applied; at 17:40 UTC, 7 degrees up, the same pressure
 *    change lowers the elevation, so refraction applies above the horizon.
 * 4. Out-of-domain inputs throw naming the field: latitude 91, month 13, 29
 *    February of 2025, pressure 0 and temperature -300; 29 February of 2024, a
 *    leap year, is accepted.
 * 5. Nonfinite site and atmosphere values and fractional integer UTC fields throw
 *    naming the field. A fractional second, second 60 and equivalent longitudes
 *    apart by one turn are admitted.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported solver on calendar instants and asserts its zenith, azimuth and elevation, the refraction gate through pressure sensitivity, and its refusals; a wrong Julian Day, sidereal time, azimuth convention or refraction gate moves these angles by far more than the tolerance.
 * @evidence contracts/development/testing.md#independent-expectations The first case's values are the published example of Reda and Andreas 2004 (NREL/TP-560-34302, table A5.1); the 0.02-degree tolerance is the issue's bound on the low-accuracy method. The equinox case follows from declination near zero and an equation of time near -7.5 minutes. Refraction proportional to pressure is the cited equation 42's form, not the implementation's output.
 * @evidence contracts/development/common.md#meaningful-documentation Compares the solver to the published Reda and Andreas site and an equatorial equinox. Exercises pressure-sensitive refraction, finite site inputs, integral civil fields, fractional seconds and the inclusive leap-second bound.
 */
export function test_analysis_sun_position(): void {
  const example: IAutoMovieSunPosition =
    AutoMovieEngineEnvironment.solveSunPosition({
      latitude: 39.742476,
      longitude: -105.1786,
      elevation: 1830.14,
      pressure: 820,
      temperature: 11,
      utc: utc(2003, 10, 17, 19, 30, 30),
    });
  TestValidator.predicate(
    "published example zenith",
    nclose(example.zenith, 50.11162, 0.02),
  );
  TestValidator.predicate(
    "published example azimuth",
    nclose(example.azimuth, 194.34024, 0.02),
  );
  TestValidator.predicate(
    "elevation is 90 minus zenith",
    nclose(example.elevation, 90 - example.zenith, 1e-12),
  );

  const equinox: IAutoMovieSunPosition =
    AutoMovieEngineEnvironment.solveSunPosition({
      latitude: 0,
      longitude: 0,
      utc: utc(2025, 3, 20, 12, 0, 0),
    });
  TestValidator.predicate(
    "equinox noon at the equator is near the zenith",
    equinox.zenith >= 0 && equinox.zenith < 3,
  );

  const below: (pressure: number) => number = (pressure: number): number =>
    AutoMovieEngineEnvironment.solveSunPosition({
      latitude: 0,
      longitude: 0,
      pressure,
      utc: utc(2025, 3, 20, 18, 47, 0),
    }).elevation;
  TestValidator.predicate(
    "a sun ten degrees down reports a negative elevation",
    below(1013.25) < -9.5 && below(1013.25) > -10.5,
  );
  TestValidator.equals(
    "below the floor no refraction reads the pressure",
    below(1013.25),
    below(500),
  );
  const above: (pressure: number) => number = (pressure: number): number =>
    AutoMovieEngineEnvironment.solveSunPosition({
      latitude: 0,
      longitude: 0,
      pressure,
      utc: utc(2025, 3, 20, 17, 40, 0),
    }).elevation;
  TestValidator.predicate(
    "above the horizon refraction lifts the sun in proportion to pressure",
    above(1013.25) > 0 && above(1013.25) - above(500) > 0.01,
  );

  const refuses: (
    patch: Partial<IAutoMovieSolveSunPosition.IProps>,
    field: string,
  ) => boolean = (
    patch: Partial<IAutoMovieSolveSunPosition.IProps>,
    field: string,
  ): boolean =>
    throwsError(
      (): IAutoMovieSunPosition =>
        AutoMovieEngineEnvironment.solveSunPosition({
          latitude: 0,
          longitude: 0,
          utc: utc(2025, 3, 20, 12, 0, 0),
          ...patch,
        }),
      field,
    );
  TestValidator.equals(
    "out-of-domain fields are refused by name",
    {
      latitude: refuses({ latitude: 91 }, "latitude"),
      month: refuses({ utc: utc(2025, 13, 1, 0, 0, 0) }, "utc.month"),
      day: refuses({ utc: utc(2025, 2, 29, 0, 0, 0) }, "utc.day"),
      pressure: refuses({ pressure: 0 }, "pressure"),
      temperature: refuses({ temperature: -300 }, "temperature"),
      leap: refuses({ utc: utc(2024, 2, 29, 0, 0, 0) }, "utc"),
    },
    {
      latitude: true,
      month: true,
      day: true,
      pressure: true,
      temperature: true,
      leap: false,
    },
  );
  for (const value of [NaN, Infinity, Number.NEGATIVE_INFINITY])
    for (const field of [
      "longitude",
      "elevation",
      "pressure",
      "temperature",
    ] as const)
      TestValidator.predicate(
        `nonfinite ${field} is refused for ${value}`,
        refuses({ [field]: value }, field),
      );
  for (const [field, value] of [
    ["year", 2025.5],
    ["year", Infinity],
    ["month", 3.5],
    ["day", 20.5],
    ["hour", 12.5],
    ["minute", 30.5],
    ["second", Infinity],
  ] as const)
    TestValidator.predicate(
      `invalid UTC ${field} is refused for ${value}`,
      refuses(
        { utc: { ...utc(2025, 3, 20, 12, 0, 0), [field]: value } },
        `utc.${field}`,
      ),
    );
  const at: (
    longitude: number,
    minute: number,
    second: number,
  ) => IAutoMovieSunPosition = (
    longitude: number,
    minute: number,
    second: number,
  ): IAutoMovieSunPosition =>
    AutoMovieEngineEnvironment.solveSunPosition({
      latitude: 0,
      longitude,
      utc: utc(2025, 3, 20, 12, minute, second),
    });
  TestValidator.predicate(
    "an additional full longitude turn preserves the elevation",
    nclose(at(375, 30, 30.25).elevation, at(15, 30, 30.25).elevation, 1e-9),
  );
  TestValidator.predicate(
    "second sixty maps to the following minute in the Julian-day formula",
    nclose(at(15, 30, 60).elevation, at(15, 31, 0).elevation, 1e-9),
  );
}

/** Build a UTC calendar instant. */
const utc: (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
) => IAutoMovieSolveSunPosition.IUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): IAutoMovieSolveSunPosition.IUtc => ({
  year,
  month,
  day,
  hour,
  minute,
  second,
});
