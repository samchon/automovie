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
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported solver on calendar instants and asserts its zenith, azimuth and elevation, the refraction gate through pressure sensitivity, and its refusals; a wrong Julian Day, sidereal time, azimuth convention or refraction gate moves these angles by far more than the tolerance.
 * @evidence contracts/development/testing.md#independent-expectations The first case's values are the published example of Reda and Andreas 2004 (NREL/TP-560-34302, table A5.1); the 0.02-degree tolerance is the issue's bound on the low-accuracy method. The equinox case follows from declination near zero and an equation of time near -7.5 minutes. Refraction proportional to pressure is the cited equation 42's form, not the implementation's output.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a mid-latitude afternoon, a near-zenith equinox noon, a sun below and above the refraction floor, and each class of refused field with a leap-year twin that must pass. Direction in world space belongs to test_analysis_sun_direction.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test discovered by its export name; no host, file or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios with their inputs and expected angles or refusals.
 */
export function test_analysis_sun_position(): void {
  const example: IAutoMovieSunPosition = AutoMovieEngineEnvironment.solveSunPosition({
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

  const equinox: IAutoMovieSunPosition = AutoMovieEngineEnvironment.solveSunPosition({
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
