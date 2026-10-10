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
 */
export function findHumanFrontotemporalia(
  head: IAutoMovieHumanHeadSkin,
  glabella: IAutoMovieVector3,
  tragion: IAutoMovieHumanHeadPair,
  excluded: ReadonlySet<number>,
): IAutoMovieHumanHeadPair {
  const band = 0.002;
  const window = 5;
  const p = head.positions;
  const rights: IAutoMovieVector3[] = [];
  const lefts: IAutoMovieVector3[] = [];
  for (let t = 0; t < head.indices.length / 3; t++) {
    if (excluded.has(t)) continue;
    for (let j = 0; j < 3; j++) {
      const v = head.indices[t * 3 + j];
      const point = { x: p[v * 3], y: p[v * 3 + 1], z: p[v * 3 + 2] };
      if (point.y < glabella.y) continue;
      const k = Math.floor((point.y - glabella.y) / band);
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
  const breadth = (k: number): number | undefined =>
    rights[k] === undefined || lefts[k] === undefined
      ? undefined
      : lefts[k].x - rights[k].x;
  for (let k = 0; k < Math.max(rights.length, lefts.length); k++) {
    const here = breadth(k);
    if (here === undefined) continue;
    let narrower = false;
    let seen = false;
    for (let j = k + 1; j <= k + window; j++) {
      const there = breadth(j);
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
