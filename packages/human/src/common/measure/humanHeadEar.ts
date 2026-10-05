import { humanSkinRegion } from "../basis/humanSkinRegion";
import type { IAutoMovieHumanHeadEar } from "./IAutoMovieHumanHeadEar";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * The head view triangles a rule leaves out for one named ear area, and the
 * area's highest point: every triangle with a vertex in the area belongs to
 * the ear, and the top is the highest of the area's vertices at rest. A name
 * the head view does not declare, or an area on another surface, refuses by
 * name.
 *
 * @evidence contracts/common.md#principled-implementation The ear is the declared area, so a rule excludes the ear itself rather than a height or a guess.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the area and one over the triangles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing or misplaced area refuses; nothing is substituted.
 * @evidence contracts/common.md#meaningful-documentation States what is excluded, how the top is read and the refusals.
 * @evidence contracts/modeling.md#spatial-conventions The top is a height in metres of the person frame at rest.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The ear area is basis data; the function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The consumer rule cites why the ear is excluded.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function humanHeadEar(
  head: IAutoMovieHumanHeadSkin,
  name: string,
): IAutoMovieHumanHeadEar {
  const region = humanSkinRegion(head, name);
  if (region.surface !== head.surface)
    throw new Error(`The skin region ${name} of ${head.id} is not on the head view skin the rules read.`);
  const members = new Set(region.vertices);
  let top = -Infinity;
  for (const v of region.vertices) top = Math.max(top, head.positions[v * 3 + 1]);
  const triangles = new Set<number>();
  for (let t = 0; t < head.indices.length / 3; t++)
    if (members.has(head.indices[t * 3]) || members.has(head.indices[t * 3 + 1]) || members.has(head.indices[t * 3 + 2]))
      triangles.add(t);
  return { triangles, top };
}
