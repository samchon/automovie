import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A draw subject's named camera placement at one requested second, in the
 * scene's world frame.
 */
export interface IAutoMovieDrawView {
  /** Camera position in world metres. */
  position: Readonly<IAutoMovieVector3>;

  /** Point the camera looks at, in world metres. */
  target: Readonly<IAutoMovieVector3>;
}
