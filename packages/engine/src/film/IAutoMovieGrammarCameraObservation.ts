import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/** One perspective camera sample at a shot boundary. */
export interface IAutoMovieGrammarCameraObservation extends IAutoMovieResolvedCamera {
  /** Vertical field of view in degrees. */
  fovY: number;
  /** Render width divided by height. */
  aspect: number;
}
