import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadPair } from "./IAutoMovieHumanHeadPair";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";

/**
 * Find the frontotemporalia on a head view, approximated on the skin. ANSUR II
 * 5.2.13 (Hotzman et al. 2011, p. 35) defines frontotemporale as "the point of
 * deepest indentation of the temporal crest of the frontal bone above the
 * browridges", located by palpation; the span is the minimum frontal breadth.
 * The skin carries no bone, so this reader takes the narrowest skin breadth
 * of the forehead above the brow ridge instead (named approximation): from
 * the glabella height upward in 2 mm bands, each band's most lateral skin
 * vertex on each side anterior to the side's tragion (the ear areas'
 * triangles, `excluded`, left out) gives the band's breadth, and the first
 * band whose breadth is smaller than every band within the next 10 mm above
 * it holds the two points. The band and window widths are a stated convention.
 * No such band refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Ear-excluded triangles supply lateral skin extremes in 2 mm bands above glabella and anterior to each tragion; the first band narrower than available bands in the next 10 mm is selected. This approximates a palpated bone landmark and missing bands are skipped.
 * @evidence contracts/common.md#clear-and-simple-design This reader owns the declared skin-band approximation while callers own head registration, glabella/tragia and ear exclusion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 2 mm bands and five-band window are explicit protocol approximations, with no expected frontal width or specimen-index exception.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes skin approximation from palpated crest, gives ear exclusion and band/window conventions, and names missing-minimum refusal.
 * @evidence contracts/performance.md#efficient-algorithms For T triangles and B highest band index, scanning costs O(T) then O(B*5) window work and O(B) sparse-array extent; complete scan is necessary for each band's lateral maxima.
 * @evidence contracts/performance.md#reuse-equivalent-work One pair of band arrays serves all candidate windows, and each band's extremes are accumulated once; no cross-shape result cache assumes registration remains unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sparse band arrays and candidate records are call-local and their extent depends on source heights; two selected points transfer, with no persistent registry, handles or tasks.
 */
export function findHumanFrontotemporalia(
  head: IAutoMovieHumanHeadSkin,
  glabella: IAutoMovieVector3,
  tragion: IAutoMovieHumanHeadPair,
  excluded: ReadonlySet<number>,
): IAutoMovieHumanHeadPair {
  const band: number = 0.002;
  const window: number = 5;
  const p: number[] = head.positions;
  const rights: IAutoMovieVector3[] = [];
  const lefts: IAutoMovieVector3[] = [];
  for (let t: number = 0; t < head.indices.length / 3; t++) {
    if (excluded.has(t)) continue;
    for (let j: number = 0; j < 3; j++) {
      const v: number = head.indices[t * 3 + j];
      const point: IAutoMovieVector3 = {
        x: p[v * 3],
        y: p[v * 3 + 1],
        z: p[v * 3 + 2],
      };
      if (point.y < glabella.y) continue;
      const k: number = Math.floor((point.y - glabella.y) / band);
      if (
        point.x < 0 &&
        point.z > tragion.right.z &&
        (rights[k] === undefined || point.x < rights[k].x)
      )
        rights[k] = point;
      if (
        point.x > 0 &&
        point.z > tragion.left.z &&
        (lefts[k] === undefined || point.x > lefts[k].x)
      )
        lefts[k] = point;
    }
  }
  const breadth: (k: number) => number | undefined = (
    k: number,
  ): number | undefined =>
    rights[k] === undefined || lefts[k] === undefined
      ? undefined
      : lefts[k].x - rights[k].x;
  for (let k: number = 0; k < Math.max(rights.length, lefts.length); k++) {
    const here: number | undefined = breadth(k);
    if (here === undefined) continue;
    let narrower: boolean = false;
    let seen: boolean = false;
    for (let j: number = k + 1; j <= k + window; j++) {
      const there: number | undefined = breadth(j);
      if (there === undefined) continue;
      seen = true;
      if (there <= here) narrower = true;
    }
    if (seen && !narrower) return { right: rights[k], left: lefts[k] };
  }
  throw new Error(
    `The head view of ${head.id} has no narrowest forehead band above the glabella.`,
  );
}
