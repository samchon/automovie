import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairPartSide } from "./humanFaceHairPartSide";

/**
 * The share of the scalp at a neutral metre-space point that a parting leaves
 * bare of fibres, in [0, 1]: the parting's region envelope times one minus the
 * magnitude of its side. The combing field sends hair on the two sides of the
 * plane away from it in proportion to the side's magnitude, so the hair
 * rooted on the plane itself stays put and the hair rooted a transition width
 * away has already left; the scalp the field uncovers is therefore widest on
 * the plane, narrows through the transition and is gone beyond it, and nothing
 * is uncovered outside the region the document limits the parting to.
 *
 * This is a model of where the field removes fibres, as the hair builder's own
 * combing does, and not a sample of the rendered ribbons: nearby roots, the
 * tip of the lock and curl move the real edge. It exists so a consumer can show
 * the scalp's own colour along a parting instead of the colour of hair that is
 * not there. Nothing is changed.
 */
export function humanFaceHairPartOccupancy(
  point: IAutoMovieVector3,
  part: NonNullable<IAutoMovieHumanFaceHair.Layer["part"]>,
): number {
  return (
    humanFaceHairEnvelope(point, part.region) *
    (1 - Math.abs(humanFaceHairPartSide(point, part)))
  );
}
