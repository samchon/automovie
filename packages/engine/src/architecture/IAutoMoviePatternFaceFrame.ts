import { IAutoMovieVector3 } from "@automovie/interface";

/** The world placement of the face a pattern was laid on. */
export interface IAutoMoviePatternFaceFrame {
  /** World point the face-local origin sits at. */
  origin: IAutoMovieVector3;
  /** Unit world direction of the face-local U axis. */
  u: IAutoMovieVector3;
  /** Unit world direction of the face-local V axis, perpendicular to U. */
  v: IAutoMovieVector3;
}
