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
 * @evidence contracts/common.md#principled-implementation Registered right/left nostril margins are grouped into 1 mm front-to-back bands; each band keeps the medial X extreme and the smallest shared-band left-minus-right gap defines the basal convention. Region registration does not certify a clinical septal boundary.
 * @evidence contracts/common.md#clear-and-simple-design The shared region reader owns source admission and this reader owns medial-band selection and minimum gap.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Band width and basal frame are declared conventions; missing shared bands refuse instead of inserting an expected columella width or adjusting a specimen.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies basal width, margin gap, front-to-back bands, narrowest-gap convention and named missing/common-band failures.
 * @evidence contracts/performance.md#efficient-algorithms For R right and L left memberships, two one-pass band Maps plus one right-band scan use O(R+L) expected work/storage; only shared bands contribute to the minimum.
 * @evidence contracts/performance.md#reuse-equivalent-work Each margin's medial extreme is accumulated once and retained for shared-band lookup; source memberships are validated by the canonical region reader without cross-shape memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two Maps and vertex lists remain call-local with cardinality bounded by the supplied margins; the scalar width escapes and no buffers, handles or tasks are retained.
 */
export function readHumanColumellaWidth(
  head: IAutoMovieHumanHeadSkin,
  rightMargin: string,
  leftMargin: string,
): number {
  const p: number[] = head.positions;
  const band: (vertices: number[], pick: (a: number, b: number) => number) => Map<number, number> = (
    vertices: number[],
    pick: (a: number, b: number) => number,
  ): Map<number, number> => {
    const out: Map<number, number> = new Map<number, number>();
    for (const v of vertices) {
      const k: number = Math.floor(p[v * 3 + 2] * 1000);
      const x: number = p[v * 3];
      const seen: number | undefined = out.get(k);
      out.set(k, seen === undefined ? x : pick(seen, x));
    }
    return out;
  };
  const right: Map<number, number> = band(humanHeadRegionVertices(head, [rightMargin]), Math.max);
  const left: Map<number, number> = band(humanHeadRegionVertices(head, [leftMargin]), Math.min);
  let width: number = Infinity;
  for (const [k, x] of right) {
    const l: number | undefined = left.get(k);
    if (l !== undefined) width = Math.min(width, l - x);
  }
  if (width === Infinity)
    throw new Error(
      `The nostril margins ${rightMargin} and ${leftMargin} of ${head.id} share no front-to-back band.`,
    );
  return width;
}
