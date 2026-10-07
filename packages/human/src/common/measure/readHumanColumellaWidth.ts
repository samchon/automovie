import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadRegionVertices } from "./humanHeadRegionVertices";

/**
 * Read the columella's basal width, in metres: the "width of the columella"
 * of the nasal base (Hwang and Kang 2003, PubMed 12725444, read as an
 * abstract only), the "Basal-view transverse columella breadth" of the
 * parameters. The columella is the "antero-posterior septum, the columna"
 * between the nares (Gray's Anatomy 1918, p. 993), so its breadth is the
 * transverse gap between the two nostril margins. In the basal view (the head
 * frame's horizontal plane, a stated convention) the margins are cut in 1 mm
 * front-to-back bands over the depth both cover; in each band the gap is the
 * left margin's most medial X less the right margin's, and the reading is the
 * smallest gap, the columella's narrowest breadth (a stated convention for
 * where along the columella it is read). Missing or misplaced areas refuse by
 * name, and so do margins with no common band.
 *
 * @evidence contracts/common.md#principled-implementation The breadth is read on each skin between the declared margin areas.
 * @evidence contracts/common.md#clear-and-simple-design One banding and one minimum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing areas and disjoint margins refuse; the view and the band are documented conventions.
 * @evidence contracts/common.md#meaningful-documentation States the sources, how far they were read, the view, the banding and the refusals.
 * @evidence contracts/modeling.md#spatial-conventions Metres along X of the head frame; right is -X.
 * @evidence contracts/anatomy.md#anatomical-source Follows Gray's columna and the cited basal columella width.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanColumellaWidth(head: IAutoMovieHumanHeadSkin, rightMargin: string, leftMargin: string): number {
  const p = head.positions;
  const band = (vertices: number[], pick: (a: number, b: number) => number): Map<number, number> => {
    const out = new Map<number, number>();
    for (const v of vertices) {
      const k = Math.floor(p[v * 3 + 2] * 1000);
      const x = p[v * 3];
      const seen = out.get(k);
      out.set(k, seen === undefined ? x : pick(seen, x));
    }
    return out;
  };
  const right = band(humanHeadRegionVertices(head, [rightMargin]), Math.max);
  const left = band(humanHeadRegionVertices(head, [leftMargin]), Math.min);
  let width = Infinity;
  for (const [k, x] of right) {
    const l = left.get(k);
    if (l !== undefined) width = Math.min(width, l - x);
  }
  if (width === Infinity) throw new Error(`The nostril margins ${rightMargin} and ${leftMargin} of ${head.id} share no front-to-back band.`);
  return width;
}
