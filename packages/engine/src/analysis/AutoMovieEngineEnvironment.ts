import type {
  IAutoMovieAnalysisSolid,
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
  IAutoMovieVector3,
  IAutoMovieHemisphereDirections,
  IAutoMovieRayObstruction,
  IAutoMovieReferenceGround,
  IAutoMovieSolidBlockQuery,
  IAutoMovieSunDirection,
  IAutoMovieSunPosition,
  IAutoMovieSolveSunPosition,
  IAutoMovieValidateEnvironmentContext,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validateEnvironmentContext as validateEnvironmentContextImplementation } from "./internal/validateEnvironmentContext";
import { collectContextSolids as contextSolidsImplementation } from "./internal/collectContextSolids";
import { calculateDewPoint as dewPointImplementation } from "./internal/calculateDewPoint";
import { environmentInstant as environmentInstantImplementation } from "./internal/environmentInstant";
import { hemisphereDirections as hemisphereDirectionsImplementation } from "./internal/hemisphereDirections";
import { rayObstructed as rayObstructedImplementation } from "./internal/rayObstructed";
import { skyward as skywardImplementation } from "./internal/skyward";
import { solidBlocks as solidBlocksImplementation } from "./internal/solidBlocks";
import { sunDirection as sunDirectionImplementation } from "./internal/sunDirection";
import { solveSunPosition as solveSunPositionImplementation } from "./internal/solveSunPosition";

/** Public operations for Auto Movie Engine Environment. */
export namespace AutoMovieEngineEnvironment {
  /** Validate a read-only environment context before an analysis uses it. */
  export function validateContext(props: IAutoMovieValidateEnvironmentContext.IProps): IAutoMovieValidation {
    return validateEnvironmentContextImplementation(props);
  }

  /**
   * Every context occluder as an analysis solid.
   *
   * Keeps context order, copies each id and references (does not copy) each
   * occluder's plane array, dropping the occluder's `kind`. It validates nothing;
   * `analyzeDaylight` validates the whole context before calling it.
   *
   * @param context Environment context whose occluders become solids.
   * @returns A new array of `{ id, planes }` records, one per occluder.
   */
  export function contextSolids(context: IAutoMovieEnvironmentContext): IAutoMovieAnalysisSolid[] {
    return contextSolidsImplementation(context);
  }

  /**
   * Dew point of moist air by the Magnus form, in degrees Celsius.
   *
   * `gamma = ln(RH) + a*T/(b+T)`, `Td = b*gamma/(a - gamma)`, with `T` in degrees
   * Celsius and `RH` as a fraction. Throws an `Error` on a non-finite temperature
   * or a humidity outside `(0, 1]`, since zero humidity has no dew point. The
   * coefficients are fitted over roughly -45 to 60 degC, and a temperature
   * outside that range is not refused. The saturated identity is mathematical;
   * floating-point evaluation has rounding error and can become nonfinite at the
   * formula's singularities, including T = -243.12 degC.
   *
   * This is the only dew-point formula in the engine; the envelope analyzer calls
   * it for the indoor air.
   *
   * @param temperature Dry-bulb air temperature in degrees Celsius; finite.
   * @param relativeHumidity Relative humidity as a fraction in `(0, 1]`.
   * @returns Dew-point temperature in degrees Celsius.
   */
  export function dewPoint(temperature: number, relativeHumidity: number): number {
    return dewPointImplementation(temperature, relativeHumidity);
  }

  /**
   * Look up one environmental instant of a context by its id.
   *
   * Returns the first instant whose `id` equals `id` exactly, or `null` when the
   * context declares none. Ids are unique only once
   * `validateEnvironmentContext` has accepted the context. The result is
   * the context's own instant object, not a copy.
   *
   * @param context Environment context to search.
   * @param id Instant id to match exactly, case and whitespace included.
   * @returns The matching instant, or `null` when none matches.
   */
  export function instant(context: IAutoMovieEnvironmentContext, id: string): IAutoMovieEnvironmentInstant | null {
    return environmentInstantImplementation(context, id);
  }

  /**
   * Deterministic cosine-weighted unit directions over the hemisphere around
   * `normal`, `count` of them in index order.
   *
   * The set is a Hammersley sequence mapped by Malley's method, so it is a
   * property of the normal and sample count: no random state, no host entropy,
   * the same directions in the same order on Windows and POSIX. Cosine weighting
   * is what makes the estimator exact for the case that matters most: a plane
   * facing the ground's own up with nothing above it sees every one of its
   * directions, so the estimate of an isotropic sky's contribution collapses to
   * the declared horizontal illuminance with no sampling error in ideal
   * arithmetic. A tilted plane loses the directions that point below the horizon,
   * and the fraction it loses does carry sampling error.
   *
   * `normal` need not be unit length; it is normalized first. Throws when `count`
   * is not a positive safe integer, or when `normal` has a non-finite component
   * or a measured norm that is nonfinite or `1e-12` or less. Memory grows with
   * `count`, which has no upper bound here.
   */
  export function hemisphereDirections(props: IAutoMovieHemisphereDirections.IProps): IAutoMovieVector3[] {
    return hemisphereDirectionsImplementation(props);
  }

  /**
   * Whether any of the given convex solids stops a ray before `maxDistance`.
   *
   * Solids are tried in list order and the first one that blocks ends the test;
   * an empty list never obstructs. A ray that starts inside a solid is obstructed
   * at once, and one leaving a point exactly on a face is not (see
   * `solidBlocks`).
   */
  export function rayObstructed(props: IAutoMovieRayObstruction.IProps): boolean {
    return rayObstructedImplementation(props);
  }

  /**
   * Whether a direction points strictly above the reference ground plane, that
   * is, has a positive component along `ground.up`.
   *
   * A direction lying on the horizon is not skyward. Neither vector needs unit
   * length. `ground.up` must be non-zero, which
   * `validateEnvironmentContext` requires; a zero up normalizes to the
   * zero vector and makes every direction non-skyward. The ground's elevation is
   * not read, because a direction, unlike a point, has no height.
   *
   * @param direction Direction to classify; any length.
   * @param ground Reference ground whose `up` defines the horizon.
   * @returns `true` when the direction rises above the horizon.
   */
  export function skyward(direction: IAutoMovieVector3, ground: IAutoMovieReferenceGround): boolean {
    return skywardImplementation(direction, ground);
  }

  /**
   * Whether a ray from `origin` along a unit `direction` is stopped by one convex
   * solid before `maxDistance`.
   *
   * The slab test over half-spaces, done analytically rather than by marching:
   * every plane either raises the entry parameter or lowers the exit one, and the
   * solid is hit exactly when an interval survives with a positive exit. A ray
   * that starts inside the solid is blocked at once, which is the right answer
   * for a sample point buried in a mass.
   *
   * Normals need not be normalized: the numerator and the denominator scale
   * together, so the parameter is unaffected by how long an authored normal is,
   * and the parallel test compares the slope against the normal's own length, so
   * it is too. A point is inside a plane when `dot(normal, point) <= offset`. A
   * ray leaving from a point exactly on a face is not blocked, because a hit
   * needs a positive exit. A ray whose slope against a plane is `1e-12` or less
   * is treated as never crossing it: starting outside that plane means a miss,
   * and starting inside leaves the other planes to decide.
   */
  export function solidBlocks(props: IAutoMovieSolidBlockQuery.IProps): boolean {
    return solidBlocksImplementation(props);
  }

  /**
   * Turn a solved sun position into the unit world direction from the site toward
   * the sun.
   *
   * The site's frame is built from the context: up is `ground.up` normalized,
   * north is `north` projected onto the ground plane and normalized, and east is
   * `north × up`, so with north along world -Z and up along +Y east is +X. The
   * direction is `cos(elevation) × (cos(azimuth) × north + sin(azimuth) × east) +
   * sin(elevation) × up`, the azimuth measured eastward from north.
   *
   * A staged sun light's `direction` is this vector negated, since a light's
   * local -Z is its direction of travel. The result is also the `sun` of an
   * `IAutoMovieEnvironmentInstant`.
   *
   * @param props The site's north and ground, and the sun position.
   * @returns Unit world vector toward the sun; below the ground plane when the
   *   elevation is negative.
   * @throws Error when `north` is parallel to `ground.up`, which leaves no
   *   heading on the ground plane.
   */
  export function sunDirection(props: IAutoMovieSunDirection.IProps): IAutoMovieVector3 {
    return sunDirectionImplementation(props);
  }

  /**
   * Solve the topocentric position of the sun for a site and a UTC instant.
   *
   * Solar coordinates follow the low-accuracy method of Meeus, "Astronomical
   * Algorithms" (2nd ed., 1998), chapter 25: geometric mean longitude, mean
   * anomaly and equation of centre, corrected for aberration and for the
   * principal nutation term in `Ω`, with the obliquity of equation 22.2 corrected
   * by the same term. Greenwich apparent sidereal time is chapter 12's mean
   * sidereal time (equation 12.4) plus the equation of the equinoxes from that
   * nutation term. The Julian Day is chapter 7's, for the proleptic Gregorian
   * calendar.
   *
   * Both the sidereal time and the solar longitude read UTC. Sidereal time is
   * defined on universal time, and leaving the solar longitude on UTC rather than
   * terrestrial time moves the sun by less than 0.001 degrees.
   *
   * The parallax of the sun at the observer's height (Reda and Andreas 2004,
   * "Solar position algorithm for solar radiation applications",
   * NREL/TP-560-34302, equations 26 to 37) makes the position topocentric; it
   * shifts the sun by at most 0.0025 degrees. Refraction follows the same
   * report's equation 42 and is applied only when the unrefracted elevation is at
   * or above -0.8333 degrees.
   *
   * Meeus states the low-accuracy coordinates to 0.01 degrees within a few
   * centuries of 2000; the Reda and Andreas example site is reproduced within
   * 0.01 degrees. The calendar must lie at or after -4712, where the Julian Day
   * formula holds.
   *
   * @param props Site, instant and atmosphere.
   * @returns Zenith, azimuth eastward from north, and refracted elevation, in
   *   degrees.
   * @throws Error naming the field when an input is out of its domain.
   */
  export function solveSunPosition(props: IAutoMovieSolveSunPosition.IProps): IAutoMovieSunPosition {
    return solveSunPositionImplementation(props);
  }
}
