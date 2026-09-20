import { IAutoMovieCameraIntent } from "@automovie/interface";
import { IAutoMovieCameraFrameEntry } from "./IAutoMovieCameraFrameEntry";

/**
 * One `frame` action paired with its resolved subject and its resolved intent
 * record: the bundle a coverage take compiles from. Carrying the intent beside
 * the action keeps the take's `cameraIntent` in one-to-one correspondence with
 * the spans its `cameraMotion` plays, by construction.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieCameraCoverageEntry drives required-landmark framing: One `frame` action paired with its resolved subject and its resolved intent record: the bundle a coverage take compiles from. Carrying the intent beside the action keeps the take's `cameraIntent` in one-to-one correspondence with the spans its `cameraMotion` plays, by construction.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieCameraCoverageEntry realizes landmark-based framing: One `frame` action paired with its resolved subject and its resolved intent record: the bundle a coverage take compiles from. Carrying the intent beside the action keeps the take's `cameraIntent` in one-to-one correspondence with the spans its `cameraMotion` plays, by construction.
 */
export interface IAutoMovieCameraCoverageEntry extends IAutoMovieCameraFrameEntry {
  /**
   * This span's resolved intent record (as the hero take's entries emit).
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieCameraCoverageEntry.intent drives required-landmark framing: This span's resolved intent record (as the hero take's entries emit).
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieCameraCoverageEntry.intent realizes landmark-based framing: This span's resolved intent record (as the hero take's entries emit).
   */
  intent: IAutoMovieCameraIntent;
}
