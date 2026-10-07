import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairEmergenceRequest } from "./IHumanFaceHairEmergenceRequest";

/**
 * The direction one hair leaves the scalp in: the surface normal tilted toward
 * the growth field by the exit elevation the caller chose from the root's
 * cited range (`humanFaceHairEmergenceRange`). The convention is that range's
 * lower end; a root rises toward the range top only when its stem provably
 * cannot clear the skin from the lower end. The azimuth is always the field's,
 * since the cited guide gives no tolerance for where hair is combed.
 *
 * The tilt is toward the field's tangential part, which is where that hair is
 * combed; a field with no tangential part leaves the hair on its normal, since
 * there is no direction to lie down in. The caller owns what happens after
 * emergence, including the surface contact this direction is projected by.
 * The tangential direction is normalized before the bounded cosine weight is
 * applied. A finite positive subnormal length therefore cannot overflow an
 * intermediate reciprocal; the same shared vector owner supplies both norms.
 *
 * @evidence contracts/common.md#principled-implementation The result is sin(a)
 *   * n + cos(a) * t, with n the unit normal and t the unit tangential part of
 *   the field, which are orthogonal, so the vector is a unit vector rising
 *   exactly a above the tangent plane and pointing where the field combs. A
 *   field with no tangential part has no direction to lie down in and leaves the
 *   hair on its normal, which is stated.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the
 *   exit direction; the cited angles and their hairline blend belong to
 *   humanFaceHairEmergenceRange, so no second copy exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style: the direction depends only on the normal, the
 *   field and the elevation chosen inside the cited range.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   what is returned, where the elevation comes from, why the azimuth is fixed
 *   and who owns what happens after emergence.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle field without varying a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Normal and field are
 *   neutral head-frame directions, the elevation is degrees converted to
 *   radians at one line, and the result is a dimensionless unit vector.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The cited angles and
 *   their source belong to humanFaceHairEmergenceRange.
 * @evidenceExclude contracts/anatomy.md#permitted-range The range owner bounds
 *   the elevation; this function applies it.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairEmergence(
  props: IHumanFaceHairEmergenceRequest,
): IAutoMovieVector3 {
  const normal = Vector3.normalize(props.normal);
  const tangential = Vector3.subtract(
    props.field,
    Vector3.scale(normal, Vector3.dot(props.field, normal)),
  );
  const length = Vector3.length(tangential);
  if (!(length > 0) || !Number.isFinite(length)) return normal;
  const angle = (props.degrees * Math.PI) / 180;
  return Vector3.normalize(
    Vector3.add(
      Vector3.scale(normal, Math.sin(angle)),
      Vector3.scale(Vector3.normalize(tangential), Math.cos(angle)),
    ),
  );
}
