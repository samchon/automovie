import { AutoMovieHumanHeadArcs } from "../../../../../packages/human/src/generation/AutoMovieHumanHeadArcs";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanSex } from "../../../../../packages/human/src/typings/AutoMovieHumanSex";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/**
 * An estimate reading, not a check: the nasion's depth behind the glabella
 * and the ear's fore-aft place on the head, from the private reference
 * curves, normalized by each person's head inputs and aggregated over the
 * four people, for the head prior's observed `profile.nasion` and `ear.forward`.
 *
 * On the head's horizontal skin (loops and arcs), along the midline (within 3
 * mm of the median plane): the nasion is the deepest point (least x) between
 * the nose's root and the forehead, sought within a face height's fifth of
 * the nasion's height (the face height, input, above the menton, the head
 * height, input, under the vertex), among the rows whose front stands within
 * 40 mm of the foremost; the glabella the most anterior point
 * within 40 mm above it. The ear's front and centre: at the tragion's height
 * (`AutoMovieHumanHeadArcs.tragionDrop` under the vertex), the ear's rim
 * standing clear of the head (farther from the median plane than half the
 * head breadth plus 3 mm), its most anterior point and the mean of its
 * points, forward of the skull's centre (the midpoint of the midline's front
 * and back where they stand farthest apart), per head length. Each cell
 * prints its mean and SD over the people or ears, no value of one person and
 * no curve.
 *
 * Scenarios:
 * 1. Prints the nasion's depth behind the glabella and the glabella's height above the nasion, per face height.
 * 2. Prints the ear's front and centre forward of the skull's centre at the tragion's height, per head length.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and the references' public head inputs (`HumanPeople.params`) and prints the aggregates; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the glabella's height reads beside `AutoMovieHumanGlabellaHeight`'s published derivation as a check.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men, both ears each.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_nasion_ear`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_nasion_ear(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_nasion_ear: no private curve pack in .references/curves; nothing read");
    return;
  }
  const depth: number[] = [];
  const rise: number[] = [];
  const earFront: number[] = [];
  const earCentre: number[] = [];
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const sex: AutoMovieHumanSex = id.startsWith("f") ? AutoMovieHumanSex.Female : AutoMovieHumanSex.Male;
    const vertex: number = HumanReferenceSections.landmarks(id).statureMm;
    const menton: number = vertex - params.head.height;
    const nasionLevel: number = menton + params.head.faceHeight;
    const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, "head", [menton, vertex]);
    const skin = (s: HumanReferenceSections.ISection): V3[] => [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points);
    const midFront = (s: HumanReferenceSections.ISection): number => {
      const xs: number[] = skin(s).filter((p: V3): boolean => Math.abs(p[2]) <= 3).map((p: V3): number => p[0]);
      return xs.length === 0 ? NaN : Math.max(...xs);
    };

    // The nasion: the midline's deepest point near its height; the glabella:
    // the most anterior within 40 mm above.
    // A row whose front skin the pack lacks reads its midline at the back of
    // the head; only rows within 40 mm of the foremost front count.
    const reach: number = params.head.faceHeight / 5;
    const near: HumanReferenceSections.ISection[] = rows.filter((s: HumanReferenceSections.ISection): boolean => Math.abs(s.y - nasionLevel) <= reach);
    const foremost: number = near.reduce((a: number, s: HumanReferenceSections.ISection): number => {
      const x: number = midFront(s);
      return Number.isFinite(x) ? Math.max(a, x) : a;
    }, -Infinity);
    let nasion: { y: number; x: number } | null = null;
    for (const s of near) {
      const x: number = midFront(s);
      if (Number.isFinite(x) && x >= foremost - 40 && (nasion === null || x < nasion.x)) nasion = { y: s.y, x };
    }
    if (nasion !== null) {
      let glabella: { y: number; x: number } | null = null;
      for (const s of rows)
        if (s.y > nasion.y && s.y <= nasion.y + 40) {
          const x: number = midFront(s);
          if (Number.isFinite(x) && (glabella === null || x > glabella.x)) glabella = { y: s.y, x };
        }
      if (glabella !== null) {
        depth.push((glabella.x - nasion.x) / params.head.faceHeight);
        rise.push((glabella.y - nasion.y) / params.head.faceHeight);
      }
    }

    // The skull's centre and the ear at the tragion's height.
    let centre: number = NaN;
    let widest: number = 0;
    for (const s of rows)
      if (s.y >= menton + 0.5 * (vertex - menton)) {
        const xs: number[] = skin(s).filter((p: V3): boolean => Math.abs(p[2]) <= 5).map((p: V3): number => p[0]);
        if (xs.length !== 0 && Math.max(...xs) - Math.min(...xs) > widest) {
          widest = Math.max(...xs) - Math.min(...xs);
          centre = (Math.max(...xs) + Math.min(...xs)) / 2;
        }
      }
    if (!Number.isFinite(centre)) continue;
    const half: number = (params.head.length * params.head.cephalicIndex) / 100 / 2;
    const tragion: number = vertex - AutoMovieHumanHeadArcs.tragionDrop(params.head, sex);
    const row: HumanReferenceSections.ISection | undefined = rows.reduce(
      (a: HumanReferenceSections.ISection | undefined, b: HumanReferenceSections.ISection): HumanReferenceSections.ISection =>
        a === undefined || Math.abs(b.y - tragion) < Math.abs(a.y - tragion) ? b : a,
      undefined as HumanReferenceSections.ISection | undefined,
    );
    if (row === undefined) continue;
    for (const side of [1, -1]) {
      const ear: V3[] = skin(row).filter((p: V3): boolean => side * p[2] > half + 3);
      if (ear.length === 0) continue;
      const xs: number[] = ear.map((p: V3): number => p[0]);
      earFront.push((Math.max(...xs) - centre) / params.head.length);
      earCentre.push((xs.reduce((a: number, b: number): number => a + b, 0) / xs.length - centre) / params.head.length);
    }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  console.log(`nasion behind glabella per face height: ${S.stat(depth, 4)}; glabella above nasion per face height: ${S.stat(rise, 4)}`);
  console.log(`ear at the tragion's height, forward of the skull centre per head length: front ${S.stat(earFront, 4)}, centre ${S.stat(earCentre, 4)}`);
}
