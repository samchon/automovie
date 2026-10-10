import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadPlanePoints } from "./humanHeadPlanePoints";

/**
 * Find pronasale on a head view: "the most anterior mid-point of the nasal
 * tip" (Katina et al. 2016, J Anat, Table 2, traditional definition), the
 * most anterior (+Z) point of the midsagittal section (the plane through
 * `sellion` normal to +X) strictly between the sellion and menton heights.
 * The rest orientation stands in for the head orientation the protocol
 * assumes (named approximation). A head with no section point in that span
 * refuses by name.
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
