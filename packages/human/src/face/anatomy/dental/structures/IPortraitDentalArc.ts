import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A dental guide measured along its horizontal arch rather than projected X.
 * All coordinates and distances use the caller's millimetre construction frame.
 * The hidden posterior continuation is inferred, not measured from the photo.
 *
 * @author Samchon
 */
export interface IPortraitDentalArc {
  /** Total horizontal arc length, including the posterior continuations. */
  length: number;

  /** Arc distance at the central parameter sample of the supplied guide. */
  center: number;

  /** Position and horizontal unit tangent at a distance on the guide. */
  sample: (distance: number) => {
    position: IAutoMovieVector3;
    tangent: IAutoMovieVector3;
  };
}
