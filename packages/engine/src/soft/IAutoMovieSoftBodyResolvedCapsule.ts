import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One resolved capsule using the validation proxy's segment-and-radius meaning.
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
