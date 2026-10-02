import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Signed side of a parting plane at a neutral metre-space point, in (-1, 1).
 * The plane is the document's `part.normal` (normalized here) at its signed
 * `offset` from the neutral frame origin; the side is the tanh of the point's
 * signed distance to it over `transitionWidth`, so it is zero on the plane,
 * rises smoothly through the transition and saturates at one on either side.
 * Hair combing and scalp tinting read the parting through this one value, so
 * the line the combed hair leaves and the line the scalp shows cannot disagree.
 * The point and the document are not changed.
 *
 * @evidence contracts/common.md#principled-implementation The side is
 *   tanh(d / w) with d the signed distance from the point to the plane through
 *   the offset along the unit normal and w the positive transition width, which
 *   is odd in d, zero on the plane and bounded by one, the smooth step between
 *   the two combing directions that the hairstyle document describes. It needs a
 *   nonzero normal and a positive width, which assertHumanFaceHair admits.
 * @evidence contracts/common.md#clear-and-simple-design One formula for the
 *   side, taken by the direction field and the scalp tint, so the combed line and
 *   the tinted line cannot drift apart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style: the value depends only on the point and the
 *   document's plane.
 * @evidence contracts/common.md#meaningful-documentation The comment states the
 *   plane, the profile, its zero and bounds, and the two readers that share it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function
 *   computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines
 *   no channel and reads the hairstyle document's parting without varying a
 *   form; the document type owns its meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no
 *   primitive.
 * @evidence contracts/modeling.md#spatial-conventions The point, the offset and
 *   the width are metres in the neutral head frame, the normal is a direction
 *   normalized here, and the result is dimensionless. Nothing is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no
 *   surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns
 *   no part, group or joint and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The parting is a styling
 *   plane and not a measured anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairPartSide(
  point: IAutoMovieVector3,
  part: Pick<
    NonNullable<IAutoMovieHumanFaceHair.Layer["part"]>,
    "normal" | "offset" | "transitionWidth"
  >,
): number {
  const axis = Vector3.normalize(Vector3.create(...part.normal));
  return Math.tanh(
    (Vector3.dot(point, axis) - part.offset) / part.transitionWidth,
  );
}
