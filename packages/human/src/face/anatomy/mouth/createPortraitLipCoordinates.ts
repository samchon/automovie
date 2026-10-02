import { createPortraitLipBandSampler } from "./createPortraitLipBandSampler";
import { IPortraitLipCoordinate } from "./structures/IPortraitLipCoordinate";

/**
 * Bind a closed outer lip loop and ordered inner curves to normalized sections.
 * All input points are XYZ millimetres; the result follows the mouth's curved
 * local centreline, not a horizontal head-Y threshold that mislabels a smile.
 * Outer paths are extracted from the loop's own extreme-X corners and sampled
 * linearly between retained anatomical knots. Z is deliberately not inferred.
 *
 * @evidence contracts/common.md#principled-implementation It is the coordinate half of `createPortraitLipBandSampler`, so the standalone coordinates and the mouth fit's coordinates come from one implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; it forwards to the sampler.
 * @evidence contracts/common.md#meaningful-documentation The comment states the units, that the coordinates follow the curved centreline and not a horizontal threshold, and that Z is not inferred.
 * @evidence contracts/modeling.md#spatial-conventions Input points are head-frame millimetres; the result is the unitless lip coordinate.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function adapts a sampler and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the sampler it forwards to shares the boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
 */
export const createPortraitLipCoordinates = (
  outer: readonly (readonly number[])[],
  upper: readonly (readonly number[])[],
  lower: readonly (readonly number[])[],
): ((point: readonly number[]) => IPortraitLipCoordinate) => {
  const sample = createPortraitLipBandSampler(outer, upper, lower);
  return (point) => sample(point).coordinate;
};
