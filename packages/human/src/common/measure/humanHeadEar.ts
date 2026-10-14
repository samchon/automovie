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
 * @evidence contracts/common.md#principled-implementation A validated named region must belong to the head surface; its highest registered Y gives top and every triangle touching a region vertex enters the exclusion set. The source convention does not prove clinical ear attachment.
 * @evidence contracts/common.md#clear-and-simple-design humanSkinRegion owns named lookup while this reader owns ear membership/top for breadth and circumference consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The touching-vertex rule and highest registered height derive from the actual region rather than expected ear dimensions or specimen ordinals.
 * @evidence contracts/common.md#meaningful-documentation The comment states region/surface refusal, touching-triangle exclusion and rest-height semantics.
 * @evidence contracts/performance.md#efficient-algorithms For R region vertices and T head triangles, set construction, top scan and triangle membership use O(R+T) expected work and O(R+T) space; every triangle must be checked for ear contact.
 * @evidence contracts/performance.md#reuse-equivalent-work One membership Set serves all three vertex checks per triangle, and the combined ear result can be reused only with the producing head view.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The member Set is temporary and the triangle Set transfers to callers; cardinality is bounded by the current region/mesh populations, without native handles or background work.
 */
export function humanHeadEar(
  head: IAutoMovieHumanHeadSkin,
  name: string,
): IAutoMovieHumanHeadEar {
  const region: ReturnType<typeof humanSkinRegion> = humanSkinRegion(head, name);
  if (region.surface !== head.surface)
    throw new Error(
      `The skin region ${name} of ${head.id} is not on the head view skin the rules read.`,
    );
  const members: Set<number> = new Set(region.vertices);
  let top: number = -Infinity;
  for (const v of region.vertices)
    top = Math.max(top, head.positions[v * 3 + 1]);
  const triangles: Set<number> = new Set<number>();
  for (let t: number = 0; t < head.indices.length / 3; t++)
    if (
      members.has(head.indices[t * 3]) ||
      members.has(head.indices[t * 3 + 1]) ||
      members.has(head.indices[t * 3 + 2])
    )
      triangles.add(t);
  return { triangles, top };
}
