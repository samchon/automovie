import { IAutoMovieCameraIntent } from "@automovie/interface";

import { IAutoMovieCameraFrameEntry } from "./IAutoMovieCameraFrameEntry";

/**
 * One `frame` action paired with its resolved subject and its resolved intent
 * record: the bundle a coverage take compiles from. Carrying the intent beside
 * the action keeps the take's `cameraIntent` in one-to-one correspondence with
 * the spans its `cameraMotion` plays, by construction.
 *
 * `performShot` builds one entry per coverage camera, spanning the whole beat
 * from time zero with the blocking's framing, move and subject, and with null
 * `focus` and `focalLength` because coverage grammar states no lens intent.
 *
 * @evidence contracts/common.md#principled-implementation Extends the hero take's frame entry with the intent record, so `compileCameraCoverage` maps the same entry list to both the camera move and the intent spans and the two lists cannot diverge in length or order.
 * @evidence contracts/common.md#clear-and-simple-design Reuses `IAutoMovieCameraFrameEntry` for the solve inputs and adds one field, rather than a parallel intent array the caller would have to keep aligned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The intent rides as guide metadata only; the camera solve never reads it, and the lens fields stay null rather than being invented for an alternate angle.
 * @evidence contracts/common.md#meaningful-documentation States what the bundle is for, the one-to-one correspondence it guarantees, how the producer fills it including the beat-long span and null lens fields, and what the intent member holds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; compiling the move is answered on `compileCameraCoverage` and `compileCameraMove`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per coverage camera per shot and consumed in the same call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds fresh action, subject and intent records created by `performShot`; the compiled take's `cameraIntent` references those same intent objects, and the entry itself is dropped after compilation.
 * @author Samchon
 */
export interface IAutoMovieCameraCoverageEntry extends IAutoMovieCameraFrameEntry {
  /**
   * This span's resolved intent record, in the same shape the hero take emits
   * into `cameraIntent`.
   */
  intent: IAutoMovieCameraIntent;
}
