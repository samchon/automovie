import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadPlanePoints } from "./humanHeadPlanePoints";

/**
 * Find pogonion on a head view: "the most anterior mid-point of the chin"
 * (Katina et al. 2016, J Anat, Table 2, traditional definition). The
 * midsagittal section (the plane through `menton` normal to +X) is read
 * upward from menton over the chin; the chin's most anterior point is the
 * first maximum of +Z before the profile turns back into the mentolabial
 * sulcus. The section's anterior points are ordered by height in 1 mm bands,
 * each band keeping its most anterior point, so one band is one profile
 * sample; the first band whose sample is more anterior than every band within
 * the next 5 mm above it is the pogonion. The band and window widths are a
 * stated convention of this reader, not part of the definition. The rest
 * orientation stands in for the protocol's head orientation (named
 * approximation). A chin with no such maximum below `ceiling` refuses by name.
 */
export function findHumanPogonion(
  head: IAutoMovieHumanHeadSkin,
  menton: IAutoMovieVector3,
  ceiling: number,
): IAutoMovieVector3 {
  const band = 0.001;
  const window = 5;
  const samples: IAutoMovieVector3[] = [];
  for (const point of humanHeadPlanePoints(head, 0, menton.x)) {
    if (point.y < menton.y || point.y > ceiling || point.z < menton.z - 0.02)
      continue;
    const k = Math.floor((point.y - menton.y) / band);
    if (samples[k] === undefined || point.z > samples[k].z) samples[k] = point;
  }
  for (let k = 0; k < samples.length; k++) {
    const sample = samples[k];
    if (sample === undefined) continue;
    let higher = false;
    let seen = false;
    for (let j = k + 1; j <= k + window && j < samples.length; j++) {
      if (samples[j] === undefined) continue;
      seen = true;
      if (samples[j].z >= sample.z) higher = true;
    }
    if (seen && !higher) return sample;
  }
  throw new Error(
    `The head view of ${head.id} has no anterior chin maximum above menton.`,
  );
}
