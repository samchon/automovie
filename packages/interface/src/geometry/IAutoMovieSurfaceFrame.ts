import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Requested placement of a rigid surface sample in one metre coordinate frame.
 * The origin places the sample centroid. The normal fixes its plane; forward is
 * projected into that plane before normalization, so neither vector scales the
 * sample. Zero or parallel directions refuse during placement.
 */
export interface IAutoMovieSurfaceFrame {
  /** Sample centroid in the caller's source or destination metre frame. */
  readonly origin: Readonly<IAutoMovieVector3>;

  /** Nonzero in-plane heading, after projection along the supplied normal. */
  readonly forward: Readonly<IAutoMovieVector3>;

  /** Nonzero oriented plane normal, independent of forward. */
  readonly normal: Readonly<IAutoMovieVector3>;
}
