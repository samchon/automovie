import { AutoMovieEngineEnvironment } from "@automovie/engine";
import type {
  IAutoMovieSunDirection,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `sunDirection` turns azimuth (eastward from north) and elevation
 * into `cos e (cos a · N + sin a · E) + sin e · U`, with E = N × U.
 *
 * Scenarios:
 *
 * 1. North −Z, up +Y: azimuth 90°, elevation 0 points east, +X.
 * 2. Elevation 90° points up.
 * 3. Azimuth 0, elevation 45°: (0, √½, −√½).
 * 4. North along up refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines azimuth and elevation in an explicit north-up basis, including invalid parallel axes.
 * @evidence contracts/development/testing.md#behavioral-verification Computes east, zenith and raised north with known vectors and tries coincident north and up.
 * @evidence contracts/development/testing.md#independent-expectations Crossing −Z north with +Y up yields +X east. A 45° elevated north splits unit magnitude equally between +Y and −Z.
 */
export function test_engine_analysis_sun_direction(): void {
  const context: IAutoMovieSunDirection.IProps["context"] = {
    north: { x: 0, y: 0, z: -1 },
    ground: { up: { x: 0, y: 1, z: 0 }, elevation: 0 },
  };
  const at: (azimuth: number, elevation: number) => IAutoMovieVector3 = (
    azimuth: number,
    elevation: number,
  ): IAutoMovieVector3 =>
    AutoMovieEngineEnvironment.sunDirection({
      context,
      position: { zenith: 90 - elevation, azimuth, elevation },
    });
  TestValidator.predicate(
    "east",
    vclose(at(90, 0), { x: 1, y: 0, z: 0 }, 1e-15),
  );
  TestValidator.predicate("up", vclose(at(0, 90), { x: 0, y: 1, z: 0 }, 1e-15));
  TestValidator.predicate(
    "north, half up",
    vclose(at(0, 45), { x: 0, y: Math.SQRT1_2, z: -Math.SQRT1_2 }, 1e-15),
  );
  TestValidator.error("north along up", (): unknown =>
    AutoMovieEngineEnvironment.sunDirection({
      context: { ...context, north: { x: 0, y: 2, z: 0 } },
      position: { zenith: 0, azimuth: 0, elevation: 90 },
    }),
  );
}
