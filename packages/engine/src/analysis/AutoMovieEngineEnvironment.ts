import type {
  IAutoMovieAnalysisSolid,
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
  IAutoMovieHemisphereDirections,
  IAutoMovieRayObstruction,
  IAutoMovieReferenceGround,
  IAutoMovieSolidBlockQuery,
  IAutoMovieSolveSunPosition,
  IAutoMovieSunDirection,
  IAutoMovieSunPosition,
  IAutoMovieValidateEnvironmentContext,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { calculateDewPoint as dewPointImplementation } from "./internal/calculateDewPoint";
import { collectContextSolids as contextSolidsImplementation } from "./internal/collectContextSolids";
import { environmentInstant as environmentInstantImplementation } from "./internal/environmentInstant";
import { hemisphereDirections as hemisphereDirectionsImplementation } from "./internal/hemisphereDirections";
import { rayObstructed as rayObstructedImplementation } from "./internal/rayObstructed";
import { skyward as skywardImplementation } from "./internal/skyward";
import { solidBlocks as solidBlocksImplementation } from "./internal/solidBlocks";
import { solveSunPosition as solveSunPositionImplementation } from "./internal/solveSunPosition";
import { sunDirection as sunDirectionImplementation } from "./internal/sunDirection";
import { validateEnvironmentContext as validateEnvironmentContextImplementation } from "./internal/validateEnvironmentContext";

/** Public operations for Auto Movie Engine Environment. */
export namespace AutoMovieEngineEnvironment {
  /**
   * Validate a typed external environment context against building-owned IDs.
   *
   * Version 1 uses metres. Instant times are finite and strictly increasing.
   * Supply finite nonnegative direct and diffuse illuminance, and null or
   * fractional outdoor humidity. A positive direct beam requires the sun above
   * the reference horizon.
   *
   * Directions need a finite measured length above 1e-12. Occluder planes and
   * reserved IDs are checked at their fields. Findings use $input paths and
   * retain declaration order.
   */
  export function validateContext(
    props: IAutoMovieValidateEnvironmentContext.IProps,
  ): IAutoMovieValidation {
    return validateEnvironmentContextImplementation(props);
  }

  /**
   * Project external occluders into analysis solids in context order.
   *
   * Each new record retains the occluder ID and borrows its plane array. Admit
   * the context before using the returned solids in an analysis.
   */
  export function contextSolids(
    context: IAutoMovieEnvironmentContext,
  ): IAutoMovieAnalysisSolid[] {
    return contextSolidsImplementation(context);
  }

  /**
   * Estimate dew point in degrees Celsius with the Magnus water-pressure fit.
   *
   * Supply finite dry-bulb temperature in degrees Celsius and finite relative
   * humidity in (0, 1]. Inputs outside that domain throw. The fitted
   * coefficients apply over roughly -45 to 60 degrees Celsius. Extrapolation
   * retains the equation's singularities.
   */
  export function dewPoint(
    temperature: number,
    relativeHumidity: number,
  ): number {
    return dewPointImplementation(temperature, relativeHumidity);
  }

  /**
   * Find an observation by exact instant ID, including case and whitespace.
   *
   * Return the first matching object from the context. A missing ID returns
   * null. Context admission establishes uniqueness.
   */
  export function instant(
    context: IAutoMovieEnvironmentContext,
    id: string,
  ): IAutoMovieEnvironmentInstant | null {
    return environmentInstantImplementation(context, id);
  }

  /**
   * Generate cosine-weighted unit directions around a finite normal.
   *
   * Count must be a positive safe integer. The normal must have finite
   * components and length above 1e-12. Scaling a finite direction with a very
   * large norm preserves its orientation.
   *
   * Samples use deterministic Hammersley order. The returned array grows with
   * count.
   */
  export function hemisphereDirections(
    props: IAutoMovieHemisphereDirections.IProps,
  ): IAutoMovieVector3[] {
    return hemisphereDirectionsImplementation(props);
  }

  /**
   * Test a unit-direction ray against a list of admitted convex solids.
   *
   * The ray ends at maxDistance in metres, including its endpoint. The first
   * blocking solid returns true. An empty list returns false.
   */
  export function rayObstructed(
    props: IAutoMovieRayObstruction.IProps,
  ): boolean {
    return rayObstructedImplementation(props);
  }

  /**
   * Test whether a direction rises above the reference ground plane.
   *
   * A positive dot product with normalized ground up is skyward. Horizontal
   * projections and a zero ground-up vector return false for finite
   * directions.
   */
  export function skyward(
    direction: IAutoMovieVector3,
    ground: IAutoMovieReferenceGround,
  ): boolean {
    return skywardImplementation(direction, ground);
  }

  /**
   * Clip a unit-direction world ray against convex half-spaces.
   *
   * The ray occupies distances from zero through maxDistance in metres. An
   * intersection at the positive maximum distance counts. A ray leaving at
   * distance zero has no positive exit and gives false.
   *
   * Supply admitted planes with dot(normal, point) ≤ offset on their inside. A
   * slope within 1e-12 times the plane-normal length is treated as parallel.
   */
  export function solidBlocks(
    props: IAutoMovieSolidBlockQuery.IProps,
  ): boolean {
    return solidBlocksImplementation(props);
  }

  /**
   * Resolve the world unit vector from an admitted site toward the sun.
   *
   * Use elevation and azimuth in degrees, with azimuth east of site north. The
   * frame projects north onto the plane perpendicular to ground up, then uses
   * north crossed with up for east.
   *
   * A north vector with horizontal share at most 1e-6 throws. A light
   * travelling away from the sun uses the negated result.
   */
  export function sunDirection(
    props: IAutoMovieSunDirection.IProps,
  ): IAutoMovieVector3 {
    return sunDirectionImplementation(props);
  }

  /**
   * Estimate the sun's topocentric zenith, azimuth and elevation for a UTC
   * instant.
   *
   * Use geodetic latitude, east longitude and the proleptic Gregorian calendar.
   * Angles are in degrees and azimuth is east of north. Atmosphere defaults are
   * 1,013.25 millibars and 10 degrees Celsius. Observer elevation defaults to
   * zero metres.
   *
   * Inputs require finite site and atmosphere scalars, integer UTC calendar
   * fields and seconds from zero through 60, including fractional seconds. The
   * solver allows finite east longitudes of any sign and applies a refraction
   * correction at and above its geometric cutoff. The low-accuracy orbital
   * approximation is intended for dates within a few centuries of 2000. Extreme
   * dates or atmosphere inputs can exceed the formulas' numeric range.
   */
  export function solveSunPosition(
    props: IAutoMovieSolveSunPosition.IProps,
  ): IAutoMovieSunPosition {
    return solveSunPositionImplementation(props);
  }
}
