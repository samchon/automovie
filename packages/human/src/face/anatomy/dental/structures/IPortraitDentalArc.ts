import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A dental guide measured along its horizontal arch rather than projected X.
 * All coordinates and distances use the caller's millimetre construction frame.
 * The hidden posterior continuation is inferred, not measured from the photo.
 *
 *
 * @evidence contracts/common.md#principled-implementation Horizontal cumulative guide distance identifies a position and unit XZ tangent independently of projected-X spacing or gingival Y.
 * @evidence contracts/common.md#clear-and-simple-design Length and central guide station accompany one compiled distance sampler used by row placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sampled posterior continuation is inferred, not photographed anatomy or an exact spline arc-length reconstruction.
 * @evidence contracts/common.md#meaningful-documentation The declaration states caller millimetres, total/central station meaning and sampled position/tangent ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitDentalArc is an erased TypeScript contract and performs no geometry or numeric algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitDentalArc declares source inputs/results; concrete producing/consuming operations own copying and equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitDentalArc acquires no runtime task, state or handle; actual array and callback lifetimes stay with their owners.
 *
 * @author Samchon
 */
export interface IPortraitDentalArc {
  /** Total horizontal arc length, including the posterior continuations. */
  length: number;

  /** Arc distance at the central parameter sample of the supplied guide. */
  center: number;

  /**
   * Position and horizontal unit tangent at a finite distance in [0,length].
   * Coordinates and distance are millimetres of the compiled guide.
   *
   * @evidence contracts/common.md#principled-implementation Binary search selects the containing positive cumulative XZ segment and interpolates its position while normalizing its horizontal chord tangent.
   * @evidence contracts/common.md#clear-and-simple-design The compiled arc owns station data and the row placement owner consumes this one position/tangent result for each crown.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-range/non-finite distance refuses; sampled chord interpolation is not an exact Catmull-Rom arc-length claim or a fitted lip attachment.
   * @evidence contracts/common.md#meaningful-documentation The member states the finite closed station interval, millimetre units and horizontal unit tangent.
   * @evidence contracts/performance.md#efficient-algorithms The actual sampler binary-searches its fixed 385-point station table and performs constant chord interpolation and normalization afterward.
   * @evidence contracts/performance.md#reuse-equivalent-work Every tooth query uses the same compiled owned guide/stations; changing the original guide requires a new sampler.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the arc closure and its bounded guide table lifetime; returned position/tangent vectors acquire no task or handle.
   */
  sample: (distance: number) => {
    position: IAutoMovieVector3;
    tangent: IAutoMovieVector3;
  };
}
