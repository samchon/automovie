import { createPortraitLipBandSampler } from "./createPortraitLipBandSampler";
import { IPortraitLipCoordinate } from "./structures/IPortraitLipCoordinate";

/**
 * Bind a closed outer lip loop and ordered inner curves to normalized sections.
 * All input points are XYZ millimetres; the result follows the mouth's curved
 * local centreline, not a horizontal head-Y threshold that mislabels a smile.
 * Outer paths are extracted from the loop's own extreme-X corners and sampled
 * linearly between retained anatomical knots. Z is deliberately not inferred.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Assigns upper and lower vermilion from the live curved oral centreline rather than a head-Y threshold.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Projects a finite XYZ point into the authoritative outer/inner lip-band sampler's normalized coordinates.
 */
export const createPortraitLipCoordinates = (
  outer: readonly (readonly number[])[],
  upper: readonly (readonly number[])[],
  lower: readonly (readonly number[])[],
): ((point: readonly number[]) => IPortraitLipCoordinate) => {
  const sample = createPortraitLipBandSampler(outer, upper, lower);
  return (point) => sample(point).coordinate;
};
