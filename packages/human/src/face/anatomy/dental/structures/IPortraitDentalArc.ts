import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A dental guide measured along its horizontal arch rather than projected X.
 * All coordinates and distances use the caller's millimetre construction frame.
 * The hidden posterior continuation is inferred, not measured from the photo.
 *
 * @evidence contracts/common.md#principled-implementation A guide sampled by horizontal arc length is the quantity crown widths are measured in, so a tooth placed by its width along it keeps its enamel width when the arch curves; the type is the handle to that parameterization, its total length, its centre and a sampler returning a position and a horizontal unit tangent.
 * @evidence contracts/common.md#clear-and-simple-design Three members, the minimum a placement loop needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The type states the metric of the parameterization, the millimetre frame and that the posterior continuation is inferred and not measured.
 * @evidence contracts/modeling.md#spatial-conventions Distances are horizontal (XZ) arc length in millimetres and positions are in the caller's millimetre construction frame; the tangent is unitless and horizontal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a curve handle and not a part or a group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The type defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; the sampler refuses a distance off the guide.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this type; it is produced by `createPortraitDentalArc` from a guide.
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
