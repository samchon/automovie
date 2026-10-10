import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairEmergenceRequest } from "./IHumanFaceHairEmergenceRequest";

/**
 * The direction one hair leaves the skin in: the surface normal tilted toward
 * the growth field by the admitted authored exit elevation or the legacy scalp
 * range (`humanFaceHairEmergenceRange`). The scalp convention is that range's
 * lower end; a root rises toward the range top only when its stem provably
 * cannot clear the skin from the lower end. The azimuth is always the field's,
 * preserving the authored comb direction in either representation.
 *
 * The tilt is toward the field's tangential part, which is where that hair is
 * combed; a field with no tangential part leaves the hair on its normal, since
 * there is no direction to lie down in. The caller owns what happens after
 * emergence, including the surface contact this direction is projected by.
 * The tangential direction is normalized before the bounded cosine weight is
 * applied. A finite positive subnormal length therefore cannot overflow an
 * intermediate reciprocal; the same shared vector owner supplies both norms.
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
