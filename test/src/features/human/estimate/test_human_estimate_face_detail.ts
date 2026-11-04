import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** The 3D Facial Norms' nasion-to-stomion over nasion-to-gnathion, women and men (74.3 / 118.6, 78.2 / 127.2; Weinberg et al. 2016). */
const STOMION: readonly [number, number] = [74.3 / 118.6, 78.2 / 127.2];

/** Shares of the lips' height, subnasale 0 to the lower lip's foot 1, at which their front-view width is read. */
const LIPS: readonly number[] = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

/**
 * An estimate reading, not a check: the face's inner details from the private
 * reference curves, normalized by each person's Farkas inputs and aggregated
 * over the four people: the orbit's depth, the lips' front-view outline, the
 * nostrils' size and the concha's depth.
 *
 * On the head's horizontal skin (loops and arcs; the eyes' and other shells'
 * curves live in another region and are not read), with the menton the head
 * height (input) under the vertex and the nasion the face height above it:
 *
 * - Orbit: at the fissure's level (half a fissure height under the nasion)
 *   and the eye's centre (half the intercanthal width plus half the fissure
 *   length from the midline), the skin's most anterior point within 3 mm
 *   (the lids over the eye); the brow's front (the most anterior skin there
 *   from 8 to 25 mm higher) and the cheek's (8 to 25 mm lower); the brow's and
 *   the cheek's lead over the lids, per fissure length.
 * - Lips: from the subnasale (the nose height under the nasion) to a quarter
 *   of the face height under the stomion (the 3D Facial Norms' share of the
 *   face height), at each tenth, the half width of the skin standing within
 *   4 mm of the midline's front, per half mouth width: the lips' front-view
 *   outline where they stand forward of the cheeks.
 * - Nostrils: the closed loops of the nose's base (within half the nose width
 *   of the midline, from the subnasale to 10 mm above it) other than the
 *   largest at each height, their breadth and depth per nose width.
 * - Concha: at the ear's band (the head's skin beyond half the head breadth
 *   plus 3 mm), the bowl's depth: the rim's farthest reach less the nearest
 *   point inside the rim's fore-aft span at the same height, per ear
 *   protrusion (input).
 *
 * Each cell prints its mean and SD over the people or sides where it reads, no
 * value of one person and no curve.
 *
 * Scenarios:
 * 1. Prints the brow's and the cheek's lead over the lids per fissure length.
 * 2. Prints the lips' half width at each tenth of their height per half mouth width.
 * 3. Prints the nostrils' breadth and depth per nose width and the loops read.
 * 4. Prints the concha's depth per ear protrusion.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and the references' public inputs (`HumanPeople.params`) and prints the aggregates; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; each count of loops records where the pack does not carry a structure.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men, both sides where a structure is paired.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_face_detail`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_face_detail(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_face_detail: no private curve pack in .references/curves; nothing read");
    return;
  }
  const brow: number[] = [];
  const cheek: number[] = [];
  const lips: number[][] = LIPS.map((): number[] => []);
  const nostrilBreadth: number[] = [];
  const nostrilDepth: number[] = [];
  const concha: number[] = [];
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const k: 0 | 1 = id.startsWith("f") ? 0 : 1;
    const vertex: number = HumanReferenceSections.landmarks(id).statureMm;
    const menton: number = vertex - params.head.height;
    const nasion: number = menton + params.head.faceHeight;
    const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, "head", [menton, vertex]);
    const skinAt = (y: number): V3[] =>
      rows
        .filter((s: HumanReferenceSections.ISection): boolean => Math.abs(s.y - y) <= 5)
        .flatMap((s: HumanReferenceSections.ISection): V3[] => [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points));
    const frontAt = (points: V3[], z: number, band: number): number => {
      const xs: number[] = points.filter((p: V3): boolean => Math.abs(p[2] - z) <= band).map((p: V3): number => p[0]);
      return xs.length === 0 ? NaN : Math.max(...xs);
    };

    // Orbit: the brow's and the cheek's lead over the lids.
    const eye: { palpebralFissureLength: number; palpebralFissureHeight: number } = params.head.face.eyePair.left;
    const level: number = nasion - eye.palpebralFissureHeight / 2;
    for (const side of [1, -1]) {
      const z: number = side * (params.head.face.intercanthalWidth / 2 + eye.palpebralFissureLength / 2);
      const lids: number = frontAt(skinAt(level), z, 3);
      let up: number = NaN;
      let down: number = NaN;
      for (const s of rows) {
        const f: number = frontAt([...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points), z, 3);
        if (!Number.isFinite(f)) continue;
        if (s.y >= level + 8 && s.y <= level + 25) up = Number.isFinite(up) ? Math.max(up, f) : f;
        if (s.y <= level - 8 && s.y >= level - 25) down = Number.isFinite(down) ? Math.max(down, f) : f;
      }
      if (Number.isFinite(lids) && Number.isFinite(up)) brow.push((up - lids) / eye.palpebralFissureLength);
      if (Number.isFinite(lids) && Number.isFinite(down)) cheek.push((down - lids) / eye.palpebralFissureLength);
    }

    // Lips: the half width of the skin standing within 4 mm of the midline's front.
    const subnasale: number = nasion - params.head.face.nose.height;
    const stomion: number = nasion - STOMION[k] * params.head.faceHeight;
    const foot: number = stomion - params.head.faceHeight / 4;
    const halfMouth: number = params.head.face.mouth.width / 2;
    LIPS.forEach((share: number, j: number): void => {
      const points: V3[] = skinAt(subnasale - share * (subnasale - foot));
      const m: number = frontAt(points, 0, 3);
      if (!Number.isFinite(m)) return;
      const near: number[] = points.filter((p: V3): boolean => p[0] >= m - 4).map((p: V3): number => Math.abs(p[2]));
      if (near.length !== 0) lips[j]!.push(Math.max(...near) / halfMouth);
    });

    // Nostrils: the smaller closed loops of the nose's base.
    const halfNose: number = params.head.face.nose.width / 2;
    for (const s of rows)
      if (s.y >= subnasale && s.y <= subnasale + 10) {
        const inner: HumanReferenceSections.IExtent[] = s.loops
          .map(HumanReferenceSections.extent)
          .filter((e: HumanReferenceSections.IExtent): boolean => Math.abs(e.centre[2]) <= halfNose && e.z[1] - e.z[0] < 2 * halfNose);
        for (const e of inner) {
          nostrilBreadth.push((e.z[1] - e.z[0]) / params.head.face.nose.width);
          nostrilDepth.push((e.x[1] - e.x[0]) / params.head.face.nose.width);
        }
      }

    // Concha: the ear bowl's depth inside its rim.
    const half: number = (params.head.length * params.head.cephalicIndex) / 100 / 2;
    for (const [side, ear] of [
      [1, params.head.earPair.left],
      [-1, params.head.earPair.right],
    ] as const) {
      let deepest: number = 0;
      for (const s of rows) {
        const points: V3[] = [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points);
        const rim: V3[] = points.filter((p: V3): boolean => side * p[2] > half + 3);
        if (rim.length < 4) continue;
        const reach: number = Math.max(...rim.map((p: V3): number => side * p[2]));
        const xs: number[] = rim.map((p: V3): number => p[0]);
        const lo: number = Math.min(...xs);
        const hi: number = Math.max(...xs);
        const inside: number[] = points.filter((p: V3): boolean => side * p[2] > half - 15 && p[0] > lo + 3 && p[0] < hi - 3).map((p: V3): number => side * p[2]);
        if (inside.length !== 0) deepest = Math.max(deepest, reach - Math.min(...inside));
      }
      if (deepest > 0) concha.push(deepest / ear.protrusion);
    }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  console.log(`orbit: brow ahead of the lids ${S.stat(brow, 3)}, cheek ahead of the lids ${S.stat(cheek, 3)} (per fissure length)`);
  LIPS.forEach((share: number, j: number): void => console.log(`lips share ${share.toFixed(1)}: half width ${S.stat(lips[j]!, 3)} (per half mouth width)`));
  console.log(`nostrils: breadth ${S.stat(nostrilBreadth, 3)}, depth ${S.stat(nostrilDepth, 3)} (per nose width)`);
  console.log(`concha: depth inside the rim ${S.stat(concha, 3)} (per ear protrusion)`);
}
