import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One artificial source, as a point radiating equally in every direction.
 *
 * Intensity is declared in candela by the production. Shipping a luminaire
 * catalogue would be shipping content; what the engine owes is the inverse
 * square law and the occlusion test, both of which are the same for every
 * fitting anyone ever specifies.
 *
 * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `IAutoMovieAnalysisLuminaire` declares one authored point source for the artificial illuminance contribution.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The luminaire record provides identity, world position, and candela intensity to the inverse-square lighting model.
 */
export interface IAutoMovieAnalysisLuminaire {
  /**
   * Stable luminaire identity within the request.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary The luminaire `id` keeps each declared fitting distinct during validation and sampling.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state This stable source key makes duplicate fittings an explicit authoring error rather than ambiguous input.
   */
  id: string;
  /**
   * World position in metres.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary Luminaire `position` places the point source relative to each measured cell and every occluder.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The world point supplies the ray direction, distance, incidence cosine, and obstruction segment for its contribution.
   */
  position: IAutoMovieVector3;
  /**
   * Luminous intensity in candela; at or above zero.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `intensity` states the emitted candela used for this fitting's supported illuminance estimate.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The nonnegative value scales the incidence cosine divided by squared source-to-sample distance.
   */
  intensity: number;
}
