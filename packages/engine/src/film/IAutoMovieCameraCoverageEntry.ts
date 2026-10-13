import { IAutoMovieCameraIntent } from "@automovie/interface";

import { IAutoMovieCameraFrameEntry } from "./IAutoMovieCameraFrameEntry";

/**
 * One `frame` action paired with its resolved subject and its resolved intent
 * record: the bundle a coverage take compiles from. Carrying the intent beside
 * the action keeps the take's `cameraIntent` in one-to-one correspondence with
 * the spans its `cameraMotion` plays, by construction.
 */
export interface IAutoMovieCameraCoverageEntry extends IAutoMovieCameraFrameEntry {
  /** This span's resolved intent record (as the hero take's entries emit). */
  intent: IAutoMovieCameraIntent;
}
