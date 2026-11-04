import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Stations as shares of the nasion-to-menton height, nasion 0, menton 1. */
const SHARES: readonly number[] = Array.from({ length: 21 }, (_: unknown, i: number): number => i * 0.05);

/** Shares of the half face width at which the front contour's depth is read. */
const ACROSS: readonly number[] = [0, 0.2, 0.4, 0.6, 0.8, 1];

/**
 * An estimate reading, not a check: the face's midline profile (nose, lips,
 * chin) and its front contour across the face (cheeks and malar region) along
 * its height, from the private reference curves, normalized by each person's
 * Farkas inputs and aggregated over the four people.
 *
 * For each reference, the menton stands the head height (input) under the
 * vertex and the nasion the face height (n-gn, input) above the menton. At
 * each twentieth of the nasion-to-menton height, on the head's horizontal
 * skin (loops and arcs): the midline's most anterior point (within 3 mm of
 * the median plane) forward of the nasion's, per face height; and the front
 * contour's place at shares of half the face width (zy-zy, input) either side
 * of the midline, behind the midline's point, per half face width (the most
 * anterior skin within 2 mm of that lateral place, both sides averaged). Each
 * cell prints its mean and SD over the people where it reads, no person's
 * value and no curve.
 *
 * Scenarios:
 * 1. For each share of the nasion-to-menton height, prints the midline's forward place per face height and the front contour's setback at each share of the half face width.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and the references' public head inputs (`HumanPeople.params`) and prints the aggregate table; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the knot table it produces cites it and states its source as the private reference curves.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men; the nose's, lips' and chin's places fall at their own shares, and the spread shows how far one knot stands for the set.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_face_profile`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_face_profile(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_face_profile: no private curve pack in .references/curves; nothing read");
    return;
  }
  const midline: number[][] = SHARES.map((): number[] => []);
  const setback: number[][][] = SHARES.map((): number[][] => ACROSS.map((): number[] => []));
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const vertex: number = HumanReferenceSections.landmarks(id).statureMm;
    const menton: number = vertex - params.head.height;
    const nasion: number = menton + params.head.faceHeight;
    const half: number = params.head.faceWidth / 2;
    const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, "head", [menton - 6, nasion + 6]);
    const at = (y: number): V3[] =>
      rows
        .filter((s: HumanReferenceSections.ISection): boolean => Math.abs(s.y - y) <= 5)
        .flatMap((s: HumanReferenceSections.ISection): V3[] => [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points));
    const front = (points: V3[], z: number, band: number): number => {
      const xs: number[] = points.filter((p: V3): boolean => Math.abs(p[2] - z) <= band).map((p: V3): number => p[0]);
      return xs.length === 0 ? NaN : Math.max(...xs);
    };
    const origin: number = front(at(nasion), 0, 3);
    if (!Number.isFinite(origin)) continue;
    SHARES.forEach((share: number, k: number): void => {
      const points: V3[] = at(nasion - share * (nasion - menton));
      const m: number = front(points, 0, 3);
      if (!Number.isFinite(m)) return;
      midline[k]!.push((m - origin) / params.head.faceHeight);
      ACROSS.forEach((across: number, j: number): void => {
        const sides: number[] = [front(points, across * half, 2), front(points, -across * half, 2)].filter((v: number): boolean => Number.isFinite(v));
        if (sides.length === 0) return;
        setback[k]![j]!.push((m - sides.reduce((a: number, b: number): number => a + b, 0) / sides.length) / half);
      });
    });
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  SHARES.forEach((share: number, k: number): void => {
    const across: string = ACROSS.map((a: number, j: number): string => `${a.toFixed(1)}: ${S.stat(setback[k]![j]!, 3)}`).join("; ");
    console.log(`face share ${share.toFixed(2)}: midline forward ${S.stat(midline[k]!, 4)}; setback per half width at ${across}`);
  });
}
