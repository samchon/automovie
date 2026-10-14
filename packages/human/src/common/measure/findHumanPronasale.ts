import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadPlanePoints } from "./humanHeadPlanePoints";

/**
 * Find pronasale on a head view: "the most anterior mid-point of the nasal
 * tip" (Katina et al. 2016, J Anat, Table 2, traditional definition), the
 * most anterior (+Z) triangle-edge crossing of the midsagittal section (the plane through
 * `sellion` normal to +X) strictly between the sellion and menton heights.
 * The rest orientation stands in for the head orientation the protocol
 * assumes (named approximation). A head with no section point in that span
 * refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Among crossings of the sellion's +X-normal plane strictly between sellion and menton heights, the largest +Z point defines the current nasal-tip approximation. Source rest orientation stands in for the measurement protocol.
 * @evidence contracts/common.md#clear-and-simple-design This instrument chooses the nasal extreme while humanHeadPlanePoints owns edge intersections and callers own its landmark heights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected nasal tip, epsilon or specimen-selected vertex replaces the most anterior admitted crossing; absent span refuses.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the midsagittal plane, strict height span, rest-orientation approximation and named absence failure.
 * @evidence contracts/performance.md#efficient-algorithms For T triangles and C crossings, the plane reader plus one maximum scan costs O(T+C) time and O(C) temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical plane reader supplies one sample population used for all comparisons; no prior pronasale is cached across shaped heads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The crossing array and discarded candidates are call-local; the selected vector escapes while no head buffer, handle or task is retained.
 */
export function findHumanPronasale(
  head: IAutoMovieHumanHeadSkin,
  sellion: IAutoMovieVector3,
  menton: IAutoMovieVector3,
): IAutoMovieVector3 {
  let best: IAutoMovieVector3 | undefined;
  for (const point of humanHeadPlanePoints(head, 0, sellion.x))
    if (
      point.y < sellion.y &&
      point.y > menton.y &&
      (best === undefined || point.z > best.z)
    )
      best = point;
  if (best === undefined)
    throw new Error(
      `The head view of ${head.id} has no midline nasal profile between sellion and menton.`,
    );
  return best;
}
