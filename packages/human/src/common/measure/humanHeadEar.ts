import { humanSkinRegion } from "../basis/humanSkinRegion";
import type { IAutoMovieHumanHeadEar } from "./IAutoMovieHumanHeadEar";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * The head view triangles a rule leaves out for one named ear area, and the
 * area's highest point: every triangle with a vertex in the area belongs to
 * the ear, and the top is the highest of the area's vertices at rest. A name
 * the head view does not declare, or an area on another surface, refuses by
 * name.
 */
export function humanHeadEar(
  head: IAutoMovieHumanHeadSkin,
  name: string,
): IAutoMovieHumanHeadEar {
  const region = humanSkinRegion(head, name);
  if (region.surface !== head.surface)
    throw new Error(
      `The skin region ${name} of ${head.id} is not on the head view skin the rules read.`,
    );
  const members = new Set(region.vertices);
  let top = -Infinity;
  for (const v of region.vertices)
    top = Math.max(top, head.positions[v * 3 + 1]);
  const triangles = new Set<number>();
  for (let t = 0; t < head.indices.length / 3; t++)
    if (
      members.has(head.indices[t * 3]) ||
      members.has(head.indices[t * 3 + 1]) ||
      members.has(head.indices[t * 3 + 2])
    )
      triangles.add(t);
  return { triangles, top };
}
