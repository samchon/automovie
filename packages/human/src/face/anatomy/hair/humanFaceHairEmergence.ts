import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairlineCoverage } from "./humanFaceHairlineCoverage";

/**
 * The angle a hair leaves the scalp at, measured from the surface rather than
 * from its normal. A follicle is not a pin. Shapiro & Shapiro (Facial Plast
 * Surg Clin North Am 21, 2013, 351-362, "Proper Angle and Direction") state
 * that in the mid scalp hair usually exits at 30 to 45 degrees, at the frontal
 * hairline at 15 to 20, and toward the temporal hairline at almost flat, 5 to
 * 10. They write these as a surgeon's placement guide for transplanted
 * hairlines and give no population, sample or measurement method. The lower
 * end of each range is taken, so roots stay near the scalp and contact holds
 * them there instead of the field pushing them down.
 */
const SCALP_DEGREES = 30;
const HAIRLINE_DEGREES = 15;

/**
 * The direction one hair leaves the scalp in: the surface normal tilted toward
 * the growth field by the exit angle its own place on the scalp carries. The
 * hairline's own transition ramp carries it, so a root at the boundary leaves
 * at the hairline's shallow angle and one behind the zone at the scalp's, by
 * the same hairline every other rule reads. The temporal hairline's 5 to 10
 * degrees is not modelled separately: the sources give no occipital figure, so
 * a per-azimuth field would be this project's own invention rather than
 * theirs.
 *
 * The tilt is toward the field's tangential part, which is where that hair is
 * combed; a field with no tangential part leaves the hair on its normal, since
 * there is no direction to lie down in. The caller owns what happens after
 * emergence, including the surface contact this direction is projected by.
 *
 * @evidence contracts/common.md#principled-implementation The result is sin(a)
 *   * n + cos(a) * t, with n the unit normal and t the unit tangential part of
 *   the field, which are orthogonal, so the vector is a unit vector rising
 *   exactly a above the tangent plane and pointing where the field combs. A
 *   field with no tangential part has no direction to lie down in and leaves the
 *   hair on its normal, which is stated. The angle is the smoothstep-weighted
 *   blend of the two sourced angles by the hairline coverage, so it stays
 *   between them.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the
 *   exit direction; the hairline ramp comes from the shared coverage function
 *   and the two angles are file constants, so no option or second copy exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style: the direction depends only on the chart
 *   position, the normal and the field.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   what is returned, the sources and what they are and are not, the unmodelled
 *   temporal figure and who owns what happens after emergence.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions The chart direction is
 *   neutral head-frame metres, normal and field are direction vectors in that
 *   frame, the two constants are degrees converted to radians at one line, and
 *   the result is a dimensionless unit vector.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidence contracts/anatomy.md#anatomical-source The source is Shapiro &
 *   Shapiro, Facial Plast Surg Clin North Am 21 (2013) 351-362, section Proper
 *   Angle and Direction, which I read: in the mid scalp hair usually exits at 30
 *   to 45 degrees, at the frontal hairline at 15 to 20, and toward the temporal
 *   hairline at almost flat, 5 to 10. It is a surgeon's placement guide for
 *   transplanted hairlines and states no population or measurement method. The
 *   two constants are the lower ends of the mid-scalp and frontal ranges, chosen
 *   by convention so roots stay near the scalp. The temporal and occipital
 *   angles are not modelled, because the paper gives no occipital figure.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairEmergence(props: {
  hairline: IAutoMovieHumanFaceHair.Layer["hairline"];
  chart: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  field: IAutoMovieVector3;
}): IAutoMovieVector3 {
  const normal = Vector3.normalize(props.normal);
  const tangential = Vector3.subtract(
    props.field,
    Vector3.scale(normal, Vector3.dot(props.field, normal)),
  );
  const length = Vector3.length(tangential);
  if (!(length > 0) || !Number.isFinite(length)) return normal;
  const coverage = humanFaceHairlineCoverage(props.chart, props.hairline);
  const degrees =
    HAIRLINE_DEGREES + (SCALP_DEGREES - HAIRLINE_DEGREES) * coverage;
  const angle = (degrees * Math.PI) / 180;
  return Vector3.normalize(
    Vector3.add(
      Vector3.scale(normal, Math.sin(angle)),
      Vector3.scale(tangential, Math.cos(angle) / length),
    ),
  );
}
