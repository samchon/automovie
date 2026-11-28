import { AutoMovieEngineEnvironment } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContext,
  IAutoMovieSunPosition,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Orient a sun position in world space through a site's north and ground up.
 *
 * Scenarios:
 *
 * 1. With north along world -Z and up along +Y, azimuth 90 and elevation 0 give +X
 *    (east is north × up); azimuth 0 gives -Z, and azimuth 180 at elevation 30
 *    gives (0, 0.5, 0.8660).
 * 2. A north with a vertical component, (0, 5, -2), orients the sun exactly as -Z
 *    does, since only its ground-plane part is read; a non-unit up gives the
 *    same result as the unit one.
 * 3. A north parallel to up, either sign, throws naming `north`.
 * 4. For the solved position of the solar position report's example site under a
 *    tilted ground, the direction has unit length and its angle from up equals
 *    the solved zenith.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported function with explicit frames and asserts world vectors, length, the angle from up and the parallel refusal; a swapped east sign, an unprojected north or a degree/radian slip fails these vectors.
 * @evidence contracts/development/testing.md#independent-expectations Expected vectors are spherical coordinates in the stated right-handed frame, worked by hand (cos 30 = 0.8660); the zenith identity follows from the definition of zenith as the angle from up.
 * @evidence contracts/development/common.md#meaningful-documentation Checks cardinal and elevated azimuths in a declared world frame, projected north under tilted or nonunit inputs, both parallel refusals and the angle between a solved direction and ground up.
 */
export function test_analysis_sun_direction(): void {
  const site: Pick<IAutoMovieEnvironmentContext, "north" | "ground"> = {
    north: { x: 0, y: 0, z: -1 },
    ground: { up: { x: 0, y: 1, z: 0 }, elevation: 0 },
  };
  const toward: (
    context: Pick<IAutoMovieEnvironmentContext, "north" | "ground">,
    azimuth: number,
    elevation: number,
  ) => IAutoMovieVector3 = (
    context: Pick<IAutoMovieEnvironmentContext, "north" | "ground">,
    azimuth: number,
    elevation: number,
  ): IAutoMovieVector3 =>
    AutoMovieEngineEnvironment.sunDirection({
      context,
      position: { zenith: 90 - elevation, azimuth, elevation },
    });

  TestValidator.predicate(
    "east on the horizon is +X",
    vclose(toward(site, 90, 0), { x: 1, y: 0, z: 0 }, 1e-12),
  );
  TestValidator.predicate(
    "north on the horizon is -Z",
    vclose(toward(site, 0, 0), { x: 0, y: 0, z: -1 }, 1e-12),
  );
  TestValidator.predicate(
    "south at thirty degrees rises toward +Z",
    vclose(toward(site, 180, 30), { x: 0, y: 0.5, z: Math.sqrt(3) / 2 }, 1e-12),
  );

  const raised: Pick<IAutoMovieEnvironmentContext, "north" | "ground"> = {
    north: { x: 0, y: 5, z: -2 },
    ground: { up: { x: 0, y: 3, z: 0 }, elevation: 0 },
  };
  TestValidator.predicate(
    "only north's ground-plane part and up's direction are read",
    vclose(toward(raised, 135, 20), toward(site, 135, 20), 1e-12),
  );

  TestValidator.equals(
    "north parallel to up is refused",
    [
      throwsError(
        (): IAutoMovieVector3 =>
          toward({ ...site, north: { x: 0, y: 2, z: 0 } }, 90, 0),
        "north",
      ),
      throwsError(
        (): IAutoMovieVector3 =>
          toward({ ...site, north: { x: 0, y: -3, z: 0 } }, 90, 0),
        "north",
      ),
    ],
    [true, true],
  );

  const tilted: Pick<IAutoMovieEnvironmentContext, "north" | "ground"> = {
    north: { x: 1, y: 0.2, z: -1 },
    ground: { up: { x: 0.1, y: 1, z: 0.05 }, elevation: 0 },
  };
  const position: IAutoMovieSunPosition = AutoMovieEngineEnvironment.solveSunPosition({
    latitude: 39.742476,
    longitude: -105.1786,
    elevation: 1830.14,
    pressure: 820,
    temperature: 11,
    utc: { year: 2003, month: 10, day: 17, hour: 19, minute: 30, second: 30 },
  });
  const direction: IAutoMovieVector3 = AutoMovieEngineEnvironment.sunDirection({
    context: tilted,
    position,
  });
  const up: number = Math.hypot(0.1, 1, 0.05);
  const fromUp: number =
    (Math.acos(
      (direction.x * 0.1 + direction.y * 1 + direction.z * 0.05) / up,
    ) *
      180) /
    Math.PI;
  TestValidator.predicate(
    "the direction is a unit vector",
    nclose(Math.hypot(direction.x, direction.y, direction.z), 1, 1e-12),
  );
  TestValidator.predicate(
    "its angle from up is the solved zenith",
    nclose(fromUp, position.zenith, 1e-9),
  );
}
