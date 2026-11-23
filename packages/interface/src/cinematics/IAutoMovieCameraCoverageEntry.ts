import type { IAutoMovieCameraFrameEntry } from "./IAutoMovieCameraFrameEntry";
import type { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";

/**
 * One `frame` action paired with its resolved subject and its resolved intent
 * record: the bundle a coverage take compiles from. Carrying the intent beside
 * the action keeps the take's `cameraIntent` in one-to-one correspondence with
 * the spans its `cameraMotion` plays, by construction.
 *
 * `performShot` builds one entry per coverage camera, spanning the whole beat
 * from time zero with the blocking's framing, move and subject, and with null
 * `focus` and `focalLength` because coverage grammar states no lens intent.
 */
export interface IAutoMovieCameraCoverageEntry extends IAutoMovieCameraFrameEntry {
  /**
   * This span's resolved intent record, in the same shape the hero take emits
   * into `cameraIntent`.
   */
  intent: IAutoMovieCameraIntent;
}
