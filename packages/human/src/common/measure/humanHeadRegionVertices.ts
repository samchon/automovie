import { humanSkinRegion } from "../basis/humanSkinRegion";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * The head view vertices of one or more named skin areas, in the order the
 * areas are named: the shared lookup the auricle and nostril instruments read
 * their parts through. An area the basis does not declare, or one on another
 * surface than the head view skin the rules read, refuses by name. An empty
 * area or an index without a finite resident XYZ also refuses: neither can
 * provide an anatomical extreme or extent.
 *
 * @evidence contracts/common.md#principled-implementation Each named source region must be nonempty, on the head surface and contain finite in-range resident XYZ indices; flattened output preserves named-region order and repeated memberships rather than inferring anatomical boundaries.
 * @evidence contracts/common.md#clear-and-simple-design One admission/lookup owner supplies auricle and nostril instruments so their extreme/extent readers share source-region semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing region becomes synthetic geometry, and invalid indices or nonfinite coordinates refuse instead of selecting a specimen-specific replacement.
 * @evidence contracts/common.md#meaningful-documentation The prose gives region-order preservation, surface/name checks and why empty/nonresident populations cannot provide an extreme.
 * @evidence contracts/performance.md#efficient-algorithms For R total supplied region memberships, flatMap validation costs O(R) plus name lookup/key work and O(R) output references; each XYZ uses a fixed three-value finite check.
 * @evidence contracts/performance.md#reuse-equivalent-work humanSkinRegion is reused for named lookup and the resulting list supplies downstream instruments; repeated regions are preserved and no cross-shape membership cache is claimed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The flattened vertex list transfers to the caller and dense three-coordinate check arrays are temporary; no borrowed position buffer, handle or running task is retained.
 */
export function humanHeadRegionVertices(
  head: IAutoMovieHumanHeadSkin,
  regions: readonly string[],
): number[] {
  return regions.flatMap((region: string): number[] => {
    const area: ReturnType<typeof humanSkinRegion> = humanSkinRegion(
      head,
      region,
    );
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
        ![
          head.positions[vertex * 3],
          head.positions[vertex * 3 + 1],
          head.positions[vertex * 3 + 2],
        ].every(Number.isFinite)
      )
        throw new Error(
          `The skin region ${region} of ${head.id} contains an invalid resident vertex ${vertex}.`,
        );
    return area.vertices;
  });
}
