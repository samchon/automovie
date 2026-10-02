import { Vector3 } from "@automovie/engine";

import { normalizedRim } from "./normalizedRim";

/**
 * The unit normal of a nostril rim's plane from its centred points.
 *
 * Shared by `resizePortraitNostrilRim` and `fitPortraitNostrilRim`. The
 * oriented area normal comes from the complete closed boundary, because
 * individual edges can be short or collinear without changing the plane's
 * meaning. Refuses a rim of zero oriented area.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation The sum of cross products of consecutive centred boundary points is twice the oriented area vector of the closed polygon (Newell), so its direction is the polygon's plane normal even when single edges are short or collinear; a zero sum has no plane and refuses.
 * @evidence contracts/common.md#clear-and-simple-design One area-normal computation shared by the fit and the resize.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject special-casing; a pure function of the centred points.
 * @evidence contracts/common.md#meaningful-documentation The comment states the area-normal basis, the sharing and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions The points are the dimensionless centred vectors of normalizedRim; the result is a unit vector in the same frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nostril rim fitting owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
 */
export const portraitNostrilRimNormal = (
  local: ReturnType<typeof normalizedRim>["local"],
) => {
  let normal = Vector3.create();
  for (let i = 0; i < local.length; i++)
    normal = Vector3.add(
      normal,
      Vector3.cross(local[i], local[(i + 1) % local.length]),
    );
  normal = Vector3.normalize(normal);
  if (Vector3.length(normal) === 0)
    throw new Error("A nasal rim needs a nonzero oriented area.");
  return normal;
};
