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
