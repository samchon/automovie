import { createPortraitLipBandSampler } from "./createPortraitLipBandSampler";
import { IPortraitLipCoordinate } from "./structures/IPortraitLipCoordinate";

/**
 * Bind a closed outer lip loop and ordered inner curves to normalized sections. All input points are XYZ millimetres; the result follows the mouth's curved local centreline, not a horizontal head-Y threshold that mislabels a smile. Outer paths are extracted from the loop's own extreme-X corners and sampled linearly between retained anatomical knots. Z is deliberately not inferred.
 *
 * @evidence contracts/common.md#principled-implementation The shared curved-band sampler supplies normalized coordinates from the same outer/inner contours.
 * @evidence contracts/common.md#clear-and-simple-design This compatibility view projects only coordinate fields while the authoritative sampler also supplies actual boundary heights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No independent head-Y classification or Z estimate is introduced; currently no direct repository execution caller uses this wrapper.
 * @evidence contracts/common.md#meaningful-documentation Source points are portrait millimetres and the normalized result follows the local curved aperture.
 * @evidence contracts/performance.md#efficient-algorithms Preparation and each sample delegate their curve-copy/linear-search cost to the band sampler.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical sampler reuse avoids a second coordinate algorithm.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains its owned sampler curves and returns small coordinate records without sample history.
 */
export const createPortraitLipCoordinates: (outer: readonly (readonly number[])[], upper: readonly (readonly number[])[], lower: readonly (readonly number[])[]) => ((point: readonly number[]) => IPortraitLipCoordinate) = (
  outer: readonly (readonly number[])[],
  upper: readonly (readonly number[])[],
  lower: readonly (readonly number[])[],
): ((point: readonly number[]) => IPortraitLipCoordinate) => {
  const sample: (point: readonly number[]) => { coordinate: IPortraitLipCoordinate; innerY: number; outerY: number; } = createPortraitLipBandSampler(outer, upper, lower);
  return (point: readonly number[]): IPortraitLipCoordinate => sample(point).coordinate;
};
