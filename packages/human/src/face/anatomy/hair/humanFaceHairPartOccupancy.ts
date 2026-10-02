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
 *
 * @evidence contracts/common.md#principled-implementation Hair rooted at signed
 *   distance d from the plane is combed away with weight |tanh(d / w)|, so the
 *   share of fibres still over a point that close to the plane is taken as the
 *   remainder 1 - |tanh(d / w)|, scaled by the same Gaussian envelope that
 *   limits the field; the product is in [0, 1] because both factors are. The
 *   premise is that the displacement of the combed roots is what uncovers the
 *   scalp, which is why a point beyond the transition, whose roots are fully
 *   combed, reads as covered, and the profile is a first-order proxy for the
 *   covering that ribbon width and nearby roots refine.
 * @evidence contracts/common.md#clear-and-simple-design The function composes
 *   the envelope and the side that the combing field already owns, and adds no
 *   second description of the parting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style: the value follows the document's plane,
 *   transition and region by one formula.
 * @evidence contracts/common.md#meaningful-documentation The comment states the
 *   quantity, why the profile has this shape, that it is a proxy for the combed
 *   field and not a sample of the ribbons, and what it is used for.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function
 *   computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines
 *   no channel and reads the hairstyle document's parting without varying a
 *   form; the document type owns its meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no
 *   primitive.
 * @evidence contracts/modeling.md#spatial-conventions The point, plane offset,
 *   width and region are metres in the neutral head frame and the result is
 *   dimensionless. Nothing is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no
 *   surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns
 *   no part, group or joint and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The parting is a styling
 *   field and carries no measured anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
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
