import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * The polar angle from the crown at which a layer's hairline lies in the
 * azimuth of a neutral chart direction: the four authored angles (front,
 * back, left, right) blended by the squared horizontal components of the
 * direction, so the boundary is smooth all around the head. On the polar
 * axis, where azimuth is undefined, it is the smallest of the four. Root
 * sampling and the scalp's own coverage both read it, so a document states
 * one hairline.
 *
 * @evidence contracts/common.md#principled-implementation The four authored
 *   polar angles are blended by the squared horizontal direction cosines (x/h)^2
 *   and (z/h)^2, which sum to one, so the result is a convex combination that
 *   stays between the smallest and largest angle. The weights are continuous
 *   where a sign flips because each is zero there. On the polar axis h is zero
 *   and the azimuth is undefined, so the smallest angle is returned; the
 *   boundary is therefore not continuous at that single point.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the
 *   hairline that root sampling and the scalp coverage both read, so a document
 *   states one boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style; the value depends only on the direction and the
 *   four angles.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the blend, its weights and the pole behaviour.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions The direction is in the
 *   neutral head frame (+Y superior, +Z anterior, +X anatomical left) and the
 *   angles are polar radians from +Y; the direction is only used as a direction,
 *   so its length carries no unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairlineBoundary(
  direction: IAutoMovieVector3,
  hairline: IAutoMovieHumanFaceHair.Layer["hairline"],
): number {
  const horizontal = Math.hypot(direction.x, direction.z);
  // At the polar axis azimuth is undefined. Both limits have theta=0 or
  // pi; the minimum boundary is the intersection of those azimuth limits.
  return horizontal === 0
    ? Math.min(...Object.values(hairline))
    : (direction.x / horizontal) ** 2 *
        (direction.x < 0 ? hairline.right : hairline.left) +
        (direction.z / horizontal) ** 2 *
          (direction.z < 0 ? hairline.back : hairline.front);
}
