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
 *
 * @evidence contracts/common.md#principled-implementation The chin's anterior extreme is found on each skin from the defined anatomical side (upward from menton), not fixed.
 * @evidence contracts/common.md#clear-and-simple-design One section, one band pass, one forward scan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No maximum refuses; the band and window widths are documented conventions.
 * @evidence contracts/common.md#meaningful-documentation States the definition, its source, the walk, both conventions and the approximation.
 * @evidence contracts/modeling.md#spatial-conventions +Z anterior, +Y up in the head frame; bands in metres.
 * @evidence contracts/anatomy.md#anatomical-source Follows Katina et al. 2016 Table 2's traditional pogonion definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
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
    if (point.y < menton.y || point.y > ceiling || point.z < menton.z - 0.02) continue;
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
  throw new Error(`The head view of ${head.id} has no anterior chin maximum above menton.`);
}
