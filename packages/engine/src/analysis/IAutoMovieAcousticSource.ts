import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One steady noise source inside the room, such as a fan or a diffuser.
 *
 * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `IAutoMovieAcousticSource` declares one steady emitter whose level, location, and directivity feed the bounded room-noise estimate.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The source record supplies the power and geometric operands for the scenario's direct-plus-diffuse pressure calculation.
 */
export interface IAutoMovieAcousticSource {
  /**
   * Stable source identity within the request.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary The source `id` preserves which declared emitter contributed to the room-level calculation.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario This key makes source validation deterministic when several emitters share the same acoustic scenario.
   */
  id: string;
  /**
   * World position in metres.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary Source `position` places the emitter so receiver distance can affect the reported direct field.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The world-space point supplies the distance term in the inverse-square source contribution.
   */
  position: IAutoMovieVector3;
  /**
   * Sound power level in dB re 1 pW; finite.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `soundPower` states the emitter strength used for the supported steady broadband level estimate.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The declared dB re 1 pW value is converted to linear power before sources are summed at a receiver.
   */
  soundPower: number;
  /**
   * Directivity factor; strictly positive, `1` being omnidirectional.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `directivity` declares how strongly this source favors its direct-field contribution over an omnidirectional emitter.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The positive factor scales the source's inverse-square term while leaving the diffuse room term unchanged.
   */
  directivity: number;
}
