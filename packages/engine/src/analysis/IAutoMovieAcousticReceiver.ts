import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One place the room is listened from.
 *
 * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `IAutoMovieAcousticReceiver` names a listening point at which the supported steady room level is evaluated.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The receiver record contributes the identity and position used to emit one spatial acoustic result.
 */
export interface IAutoMovieAcousticReceiver {
  /**
   * Stable receiver identity within the request.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary The receiver `id` keeps each reported listening location independently traceable.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario This identity becomes the stable sample key for the level computed at that receiver.
   */
  id: string;
  /**
   * World position in metres.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary Receiver `position` establishes where every source's direct-field distance is measured.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The point is paired with each source location to calculate the scenario's inverse-square attenuation.
   */
  position: IAutoMovieVector3;
}
