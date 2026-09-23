import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairlineCoverage } from "./humanFaceHairlineCoverage";

/**
 * The angle a hair leaves the scalp at, measured from the surface rather than
 * from its normal. A follicle is not a pin: the hair restoration literature
 * gives 30 to 45 degrees over the mid-scalp and 15 to 20 at the frontal
 * hairline, with the frontotemporal angle at 10 to 15 and the temporal
 * hairline nearly flat at 5 to 10 (Shapiro & Shapiro, Facial Plast Surg Clin
 * North Am 2013). The lower end of each range is used, so hair lies against
 * the scalp and the surface contact holds it there rather than the field
 * having to push it down.
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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Emerges every generated hair by one shared anatomical rule instead of a per-person correction.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair States the exit angle from the scalp and tilts the normal toward the growth field by it.
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
