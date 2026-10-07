import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanSkinRegion } from "../basis/humanSkinRegion";

/**
 * The head view vertices of one or more named skin areas, in the order the
 * areas are named: the shared lookup the auricle and nostril instruments read
 * their parts through. An area the basis does not declare, or one on another
 * surface than the head view skin the rules read, refuses by name. An empty
 * area or an index without a finite resident XYZ also refuses: neither can
 * provide an anatomical extreme or extent.
 *
 * @evidence contracts/common.md#principled-implementation Parts are read through the basis's own named areas, never vertex lists in the instrument.
 * @evidence contracts/common.md#clear-and-simple-design One lookup and one surface check per area.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing or misplaced area refuses by name.
 * @evidence contracts/common.md#meaningful-documentation States the order and both refusals.
 * @evidence contracts/modeling.md#spatial-conventions Returns vertex indices of the head view skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The lookup carries no anatomical definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function humanHeadRegionVertices(head: IAutoMovieHumanHeadSkin, regions: readonly string[]): number[] {
  return regions.flatMap((region) => {
    const area = humanSkinRegion(head, region);
    if (area.surface !== head.surface)
      throw new Error(`The skin region ${region} of ${head.id} is not on the head view skin the rules read.`);
    if (area.vertices.length === 0)
      throw new Error(`The skin region ${region} of ${head.id} is empty.`);
    for (const vertex of area.vertices)
      if (!Number.isInteger(vertex) || vertex < 0 || vertex * 3 + 2 >= head.positions.length ||
          !head.positions.slice(vertex * 3, vertex * 3 + 3).every(Number.isFinite))
        throw new Error(`The skin region ${region} of ${head.id} contains an invalid resident vertex ${vertex}.`);
    return area.vertices;
  });
}
