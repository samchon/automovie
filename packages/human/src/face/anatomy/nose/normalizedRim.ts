import { Vector3 } from "@automovie/engine";

/**
 * Centre and scale a nostril rim's millimetre points for plane and ellipse
 * fitting.
 *
 * `scale` is the largest absolute coordinate (1 when every coordinate is zero),
 * `normalized` the points divided by it, `center` their mean and `local` the
 * centred vectors. Shared by `fitPortraitNostrilRim` and
 * `resizePortraitNostrilRim` so both fit on the same basis.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Dividing every coordinate by the largest absolute value keeps products of millimetre coordinates finite while a plane and an ellipse are fitted, and the mean is removed so fitting is translation independent; the scale is 1 for an all-zero rim so no division by zero occurs.
 * @evidence contracts/common.md#clear-and-simple-design One shared centring and scaling used by the fit and the resize, so both work on the same basis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject special-casing; a pure function of the points.
 * @evidence contracts/common.md#meaningful-documentation The comment states the returned fields, their units and both consumers.
 * @evidence contracts/modeling.md#spatial-conventions Input is head millimetres; `normalized` and `local` are dimensionless after division by `scale`, and callers multiply `scale` back.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nostril rim fitting owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
 */
export const normalizedRim = (points: number[][]) => {
  const scale = Math.max(...points.flat().map(Math.abs)) || 1;
  const normalized = points.map((point) => point.map((value) => value / scale));
  const center = [0, 1, 2].map(
    (axis) =>
      normalized.reduce((sum, point) => sum + point[axis], 0) / points.length,
  );
  const local = normalized.map((point) =>
    Vector3.create(
      point[0] - center[0],
      point[1] - center[1],
      point[2] - center[2],
    ),
  );
  return { scale, normalized, center, local };
};
