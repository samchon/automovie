import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { FilmBodyRig as Rig } from "../motion/rig/FilmBodyRig";
import { filmTrunkFromSegments } from "../motion/rig/filmTrunkFromSegments";

/** Read choreography landmarks from the admitted physical targets, so aim follows the same pelvis and shoulders as support fitting. */
export function boutPhysicalTrunk(
  segments: Readonly<Record<string, P.ITransform>>,
  profile: P,
): Rig.Trunk {
  return filmTrunkFromSegments(segments, profile);
}
