import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Shares of the fissure's length, medial canthus 0 to lateral 1. */
const SHARES: readonly number[] = Array.from({ length: 11 }, (_: unknown, i: number): number => i * 0.1);

/**
 * An estimate reading, not a check: the palpebral fissure's outline and the
 * lid margins' forward places, from the private reference curves, normalized
 * by each person's fissure inputs and aggregated over the four people's
 * eight eyes.
 *
 * A horizontal section through the open fissure cuts the face's skin into
 * open arcs that end on the lid margins, so the margins are the ends of the
 * head's skin arcs near the eye: every arc end within the eye's box (from
 * the nasion's height, the face height above the menton, down to a fissure
 * height under it plus one above, between 8 mm and 60 mm from the median
 * plane, in the face's front 40 mm). Each eye's ends give its canthi (the
 * medial and lateral extremes) and, at each tenth of the fissure's length,
 * the upper and lower margins' heights relative to the canthi's mean height
 * per fissure height (input), and the margins' forward places relative to
 * the canthi's mean per fissure length (input). Each cell prints its mean and
 * SD over the eyes, no eye's value and no curve.
 *
 * Limits: the sections stand 10 mm apart in the pack's source, so a fissure
 * about 10 mm high is cut by one or two sections; the reading records how
 * many ends it found, and an eye with fewer than four is left out.
 *
 * Scenarios:
 * 1. Prints the eyes read and their ends, then for each tenth of the fissure the upper and lower margins' heights and forward places.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and the references' public face inputs (`HumanPeople.params`) and prints the aggregate table; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports.
 * @evidence contracts/testing.md#distinguishing-cases Both eyes of two women and two men; the count of ends shows where the sections are too sparse to hold a margin.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_lid_margins`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_lid_margins(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_lid_margins: no private curve pack in .references/curves; nothing read");
    return;
  }
  const upper: number[][] = SHARES.map((): number[] => []);
  const lower: number[][] = SHARES.map((): number[] => []);
  const forward: number[][] = SHARES.map((): number[] => []);
  const counts: number[] = [];
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const vertex: number = HumanReferenceSections.landmarks(id).statureMm;
    const nasion: number = vertex - params.head.height + params.head.faceHeight;
    for (const [side, eye] of [
      [1, params.head.face.eyePair.left],
      [-1, params.head.face.eyePair.right],
    ] as const) {
      const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, "head", [nasion - 2 * eye.palpebralFissureHeight, nasion + eye.palpebralFissureHeight]);
      const all: V3[] = rows.flatMap((s: HumanReferenceSections.ISection): V3[] => [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points));
      if (all.length === 0) continue;
      const face: number = Math.max(...all.map((p: V3): number => p[0]));
      const ends: V3[] = rows.flatMap((s: HumanReferenceSections.ISection): V3[] =>
        s.arcs.flatMap((a: HumanReferenceSections.ILoop): V3[] => [a.points[0]!, a.points[a.points.length - 1]!]),
      ).filter((p: V3): boolean => side * p[2] >= 8 && side * p[2] <= 60 && p[0] >= face - 40);
      counts.push(ends.length);
      if (ends.length < 4) continue;
      const medial: V3 = ends.reduce((a: V3, b: V3): V3 => (side * b[2] < side * a[2] ? b : a));
      const lateral: V3 = ends.reduce((a: V3, b: V3): V3 => (side * b[2] > side * a[2] ? b : a));
      const span: number = side * (lateral[2] - medial[2]);
      const level: number = (medial[1] + lateral[1]) / 2;
      const depth: number = (medial[0] + lateral[0]) / 2;
      if (!(span > 0)) continue;
      SHARES.forEach((share: number, k: number): void => {
        const z: number = medial[2] + side * share * span;
        const near: V3[] = ends.filter((p: V3): boolean => Math.abs(p[2] - z) <= 0.06 * span);
        if (near.length === 0) return;
        const ys: number[] = near.map((p: V3): number => p[1]);
        upper[k]!.push((Math.max(...ys) - level) / eye.palpebralFissureHeight);
        lower[k]!.push((Math.min(...ys) - level) / eye.palpebralFissureHeight);
        forward[k]!.push((near.reduce((a: number, p: V3): number => a + p[0], 0) / near.length - depth) / eye.palpebralFissureLength);
      });
    }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  console.log(`lid margins: arc ends per eye ${S.stat(counts, 1)}`);
  SHARES.forEach((share: number, k: number): void =>
    console.log(`fissure share ${share.toFixed(1)}: upper ${S.stat(upper[k]!, 3)}, lower ${S.stat(lower[k]!, 3)} (per fissure height); forward ${S.stat(forward[k]!, 3)} (per fissure length)`),
  );
}
