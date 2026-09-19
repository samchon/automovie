import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One sleeve where a run crosses a boundary of the served environment.
 *
 * A penetration is a first-class record rather than a property of the run
 * because a boundary owns it: a fire compartment wall, a waterproof tanking
 * layer and an acoustic separation each care that the hole exists, how big it
 * is, and whether it was made good.
 *
 * @evidence requirements/building-exterior/services-and-envelope-interfaces.md#building-service-envelope-penetration Exposes `IAutoMovieServicePenetration` as the portable data boundary for the building service envelope penetration requirement.
 * @evidence specifications/building-envelope/services-water-weather-and-site.md#building-envelope-service-penetration-equipment-invariant Types `IAutoMovieServicePenetration` for the building envelope service penetration equipment invariant system contract.
 */
export interface IAutoMovieServicePenetration {
  /**
   * Stable penetration identity within the network.
   *
   * @evidence requirements/building-exterior/services-and-envelope-interfaces.md#building-service-envelope-penetration Exposes `id` as the portable data boundary for the building service envelope penetration requirement.
   * @evidence specifications/building-envelope/services-water-weather-and-site.md#building-envelope-service-penetration-equipment-invariant Types `id` for the building envelope service penetration equipment invariant system contract.
   */
  id: string;

  /**
   * Id of the boundary of the served environment this sleeve is cut through.
   *
   * @evidence requirements/building-exterior/services-and-envelope-interfaces.md#building-service-envelope-penetration Exposes `boundary` as the portable data boundary for the building service envelope penetration requirement.
   * @evidence specifications/building-envelope/services-water-weather-and-site.md#building-envelope-service-penetration-equipment-invariant Types `boundary` for the building envelope service penetration equipment invariant system contract.
   */
  boundary: string;

  /**
   * Id of the declared opening of that boundary the sleeve passes through, or
   * `null` when the sleeve is a bare cored hole.
   *
   * Citing one is a stronger claim than citing the boundary alone: where that
   * opening states a profile, the sleeve is held inside the void it names
   * rather than merely somewhere on the same wall.
   *
   * @evidence requirements/building-exterior/services-and-envelope-interfaces.md#building-service-envelope-penetration Exposes `opening` as the portable data boundary for the building service envelope penetration requirement.
   * @evidence specifications/building-envelope/services-water-weather-and-site.md#building-envelope-service-penetration-equipment-invariant Types `opening` for the building envelope service penetration equipment invariant system contract.
   */
  opening: string | null;

  /**
   * World position of the sleeve centre, in metres.
   *
   * Where the pierced boundary declares a face, this is read in that boundary's
   * own frame and held inside its outline and its thickness. Where it declares
   * none, the position is only held against the runs that cite the sleeve, and
   * `serviceAnalysisSupport` reports the difference by name.
   *
   * @evidence requirements/building-exterior/services-and-envelope-interfaces.md#building-service-envelope-penetration Exposes `position` as the portable data boundary for the building service envelope penetration requirement.
   * @evidence specifications/building-envelope/services-water-weather-and-site.md#building-envelope-service-penetration-equipment-invariant Types `position` for the building envelope service penetration equipment invariant system contract.
   */
  position: IAutoMovieVector3;

  /**
   * Clear radius of the sleeve in metres; greater than `0`.
   *
   * @evidence requirements/building-exterior/services-and-envelope-interfaces.md#building-service-envelope-penetration Exposes `radius` as the portable data boundary for the building service envelope penetration requirement.
   * @evidence specifications/building-envelope/services-water-weather-and-site.md#building-envelope-service-penetration-equipment-invariant Types `radius` for the building envelope service penetration equipment invariant system contract.
   */
  radius: number;

  /**
   * Whether the annulus around the run was made good — fire-stopped, tanked or
   * gasketed. A sleeve through a waterproof membrane that is not sealed is a
   * leak the render cannot show.
   *
   * @evidence requirements/building-exterior/services-and-envelope-interfaces.md#building-service-envelope-penetration Exposes `sealed` as the portable data boundary for the building service envelope penetration requirement.
   * @evidence specifications/building-envelope/services-water-weather-and-site.md#building-envelope-service-penetration-equipment-invariant Types `sealed` for the building envelope service penetration equipment invariant system contract.
   */
  sealed: boolean;
}
