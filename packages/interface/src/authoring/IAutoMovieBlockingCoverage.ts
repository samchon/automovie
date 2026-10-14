import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";

/**
 * One additional take and the staged camera that owns it.
 *
 * The take compiles its single intent across the whole beat from its own staged camera, starting at shot time 0, so a render host can select that angle at any instant. It carries no focus or focal length, and its compiled cameraIntent states both as null.
 *
 * @evidence contracts/common.md#principled-implementation `blockBeat` refuses a blank, unstaged or repeated `camera`, an unknown framing or move, and an unplaced `on` node; `performShot` repeats the camera and vocabulary checks once the hero camera is elected, refuses the hero's own camera and an `on` that resolves to no point, and compiles each take as one `frame` entry spanning the whole shot through `compileCameraCoverage`.
 * @evidence contracts/common.md#clear-and-simple-design Extends the shared camera grammar with only the camera id, because a take differs from the hero intent solely in which staged camera renders it and in having no timing of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A take never joins the hero election, so a coverage camera cannot silently become a second live camera; no camera id or framing is treated differently.
 * @evidence contracts/common.md#meaningful-documentation States that the take spans the whole beat, that it has no focus or lens intent, and which cameras its id may and may not name.
 * @author Samchon
 */
export interface IAutoMovieBlockingCoverage extends IAutoMovieBlockingCamera {
  /**
   * Non-blank staged camera id for this take, distinct from the elected hero camera and from every other coverage take.
   */
  camera: string;
}
