import { humanSkinRegion } from "../basis/humanSkinRegion";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * The head view vertices of one or more named skin areas, in the order the
 * areas are named: the shared lookup the auricle and nostril instruments read
 * their parts through. An area the basis does not declare, or one on another
 * surface than the head view skin the rules read, refuses by name. An empty
 * area or an index without a finite resident XYZ also refuses: neither can
 * provide an anatomical extreme or extent.
 */
export function humanHeadRegionVertices(
  head: IAutoMovieHumanHeadSkin,
  regions: readonly string[],
): number[] {
  return regions.flatMap((region) => {
    const area = humanSkinRegion(head, region);
    if (area.surface !== head.surface)
      throw new Error(
        `The skin region ${region} of ${head.id} is not on the head view skin the rules read.`,
      );
    if (area.vertices.length === 0)
      throw new Error(`The skin region ${region} of ${head.id} is empty.`);
    for (const vertex of area.vertices)
      if (
        !Number.isInteger(vertex) ||
        vertex < 0 ||
        vertex * 3 + 2 >= head.positions.length ||
        !head.positions.slice(vertex * 3, vertex * 3 + 3).every(Number.isFinite)
      )
        throw new Error(
          `The skin region ${region} of ${head.id} contains an invalid resident vertex ${vertex}.`,
        );
    return area.vertices;
  });
}
