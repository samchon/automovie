import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";

/** One additional take and the staged camera that owns it. */
export interface IAutoMovieBlockingCoverage extends IAutoMovieBlockingCamera {
  /** Distinct staged camera identity for this take. */
  camera: string;
}
