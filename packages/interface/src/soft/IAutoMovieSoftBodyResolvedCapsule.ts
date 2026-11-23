import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One resolved capsule using the validation proxy's segment-and-radius meaning.
 * Endpoints are world metres from one absolute soft step; their geometry is
 * supplied by the wearable resolver rather than resampled by cloth
 * integration.
 */
export interface IAutoMovieSoftBodyResolvedCapsule {
  /** Stable source capsule identity. */
  id: string;

  /** First resolved segment endpoint. */
  from: IAutoMovieVector3;

  /** Second resolved segment endpoint. */
  to: IAutoMovieVector3;

  /** Shared proxy radius in metres. */
  radius: number;
}
