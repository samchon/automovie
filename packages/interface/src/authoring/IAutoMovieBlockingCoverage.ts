import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";

/**
 * One additional take and the staged camera that owns it.
 *
 * The take plays its single intent across the whole beat from its own staged
 * camera and carries no focus or focal length.
 *
 * @author Samchon
 */
export interface IAutoMovieBlockingCoverage extends IAutoMovieBlockingCamera {
  /**
   * Staged camera id for this take, distinct from the hero camera and from
   * every other coverage take.
   */
  camera: string;
}
