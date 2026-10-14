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
 * sample. Points more than 20 mm behind menton are excluded by this profile
 * convention. The first band whose sample is more anterior than every band within
 * the next 5 mm above it is the pogonion. The band and window widths are a
 * stated convention of this reader, not part of the definition. The rest
 * orientation stands in for the protocol's head orientation (named
 * approximation). A chin with no such maximum below `ceiling` refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation The menton midsagittal crossings are grouped into 1 mm height bands below the ceiling; the first +Z maximum against the next 5 mm defines the chin approximation. Samples more than 20 mm behind menton are excluded by the current profile convention.
 * @evidence contracts/common.md#clear-and-simple-design The common plane-crossing owner supplies samples and this instrument owns the chin band/window selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1 mm, 5 mm and 20 mm profile conventions are explicit approximation boundaries rather than expected chin coordinates or fixture branches.
 * @evidence contracts/common.md#meaningful-documentation The prose states landmark role, rest-orientation approximation, band/window search, posterior guard and missing-maximum refusal.
 * @evidence contracts/performance.md#efficient-algorithms For T triangles, C crossing samples and B highest band index, work is O(T+C+B*5) and memory O(C+B); the shared crossing scan and band extrema are required for the first local profile maximum.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing head-plane reader is reused, and each band's most anterior sample is accumulated once for all later window comparisons.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Crossing/band arrays are call-local with extent driven by source profile heights; one chosen point transfers and no source mesh, native handle or task is retained.
 */
export function findHumanPogonion(
  head: IAutoMovieHumanHeadSkin,
  menton: IAutoMovieVector3,
  ceiling: number,
): IAutoMovieVector3 {
  const band: number = 0.001;
  const window: number = 5;
  const samples: IAutoMovieVector3[] = [];
  for (const point of humanHeadPlanePoints(head, 0, menton.x)) {
    if (point.y < menton.y || point.y > ceiling || point.z < menton.z - 0.02)
      continue;
    const k: number = Math.floor((point.y - menton.y) / band);
    if (samples[k] === undefined || point.z > samples[k].z) samples[k] = point;
  }
  for (let k: number = 0; k < samples.length; k++) {
    const sample: IAutoMovieVector3 | undefined = samples[k];
    if (sample === undefined) continue;
    let higher: boolean = false;
    let seen: boolean = false;
    for (let j: number = k + 1; j <= k + window && j < samples.length; j++) {
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
