import type { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";

/**
 * One additional take and the staged camera that owns it.
 *
 * The take compiles its single intent across the whole beat from its own staged
 * camera, starting at shot time 0, so a render host can select that angle at
 * any instant. It carries no focus or focal length, and its compiled
 * cameraIntent states both as null.
 */
export interface IAutoMovieBlockingCoverage extends IAutoMovieBlockingCamera {
  /**
   * Staged camera id for this take, distinct from the elected hero camera and
   * from every other coverage take.
   */
  camera: string;
}
