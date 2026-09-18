import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A dental guide measured along its horizontal arch rather than projected X.
 * All coordinates and distances use the caller's millimetre construction frame.
 * The hidden posterior continuation is inferred, not measured from the photo.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Defines arc-length position and horizontal tangents for placing an enamel row on its shared guide.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries millimetre guide length, the central station and a bounded XZ-distance sampler for crown placement.
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
