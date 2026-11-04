import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/**
 * An estimate reading, not a check: three sites the published measures name
 * without placing, from the private reference curves, normalized and
 * aggregated over the four people.
 *
 * - The ankle's least girth (ISO 8559-1 5.3.26, the minimum leg girth above
 *   the malleoli): on each leg's horizontal sections from the pack's ankle cut
 *   up to a quarter of the way to the crotch, the height of the least taut
 *   girth, above the floor per the reference's lateral malleolus height
 *   (`ankleHeight`, input) and per stature.
 * - The toes' heads: on each foot's sections below 25 mm, the loops ahead of
 *   0.7 of the foot's length (the toes, parted from the forefoot), each
 *   loop's foremost point along the foot's axis and its centre across it, per
 *   foot length, ordered medial to lateral; the count of toes read per foot.
 * - The neck's box at its tape site: between the neck's lowest skin above
 *   cervicale's height (stature times ANSUR II's share) and the menton (the
 *   vertex less the head height, input), the section of least taut girth
 *   (the girth just below the larynx, ANSUR II's site, taken as the neck's
 *   least), its breadth over depth and its fullness in its box (0 the rhombus,
 *   1 the box).
 *
 * Each cell prints its mean and SD, no value of one person and no curve.
 *
 * Scenarios:
 * 1. Prints the ankle's least-girth height per malleolus height and per stature.
 * 2. Prints the toes read per foot and each toe's tip and centre per foot length, medial to lateral.
 * 3. Prints the neck's breadth over depth and fullness at its least girth.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and the references' public inputs (`HumanPeople.params`) and prints the aggregates; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the toes read per foot records where the sections do not part them.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men, both legs and feet each.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_sites`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_sites(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_sites: no private curve pack in .references/curves; nothing read");
    return;
  }
  const ankleOverMalleolus: number[] = [];
  const ankleOverStature: number[] = [];
  const toeCount: number[] = [];
  const toeTip: number[][] = [[], [], [], [], []];
  const toeAcross: number[][] = [[], [], [], [], []];
  const neckRatio: number[] = [];
  const neckFullness: number[] = [];
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const marks: HumanReferenceSections.ILandmarks = HumanReferenceSections.landmarks(id);
    const malleolus: number | undefined = params.extremities?.feet?.left.ankleHeight;

    // The ankle's least girth above the ankle cut.
    for (const [region, cut] of [
      ["leg_l", marks.ankle_lMm],
      ["leg_r", marks.ankle_rMm],
    ] as const) {
      let best: { y: number; girth: number } | null = null;
      for (const s of HumanReferenceSections.sections(id, region, [cut, cut + 0.25 * (marks.crotchMm - cut)]))
        for (const l of s.loops) {
          const g: number = HumanReferenceSections.extent(l).girth;
          if (best === null || g < best.girth) best = { y: s.y, girth: g };
        }
      if (best === null) continue;
      ankleOverStature.push(best.y / marks.statureMm);
      if (malleolus !== undefined) ankleOverMalleolus.push(best.y / malleolus);
    }

    // The toes' heads.
    for (const [region, side] of [
      ["foot_l", 1],
      ["foot_r", -1],
    ] as const) {
      const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, region).filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
      const points: V3[] = rows.flatMap((s: HumanReferenceSections.ISection): V3[] => s.loops.flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points));
      if (points.length === 0) continue;
      const heel: V3 = points.reduce((a: V3, b: V3): V3 => (b[0] < a[0] ? b : a));
      const toe: V3 = points.reduce((a: V3, b: V3): V3 => (b[0] > a[0] ? b : a));
      const length: number = Math.hypot(toe[0] - heel[0], toe[2] - heel[2]);
      const u: [number, number] = [(toe[0] - heel[0]) / length, (toe[2] - heel[2]) / length];
      const along = (p: V3): number => (p[0] - heel[0]) * u[0] + (p[2] - heel[2]) * u[1];
      const across = (p: V3): number => side * (-(p[0] - heel[0]) * u[1] + (p[2] - heel[2]) * u[0]);
      const low: HumanReferenceSections.ISection[] = rows.filter((s: HumanReferenceSections.ISection): boolean => s.y <= 25);
      const toes: { tip: number; across: number }[] = [];
      for (const s of low)
        for (const l of s.loops) {
          if (!l.points.every((p: V3): boolean => along(p) >= 0.7 * length)) continue;
          const tip: number = Math.max(...l.points.map(along));
          const centre: number = l.points.map(across).reduce((a: number, b: number): number => a + b, 0) / l.points.length;
          if (!toes.some((t: { tip: number; across: number }): boolean => Math.abs(t.across - centre) < 6)) toes.push({ tip, across: centre });
        }
      toeCount.push(toes.length);
      if (toes.length !== 5) continue;
      toes.sort((a: { across: number }, b: { across: number }): number => a.across - b.across);
      toes.forEach((t: { tip: number; across: number }, k: number): void => {
        toeTip[k]!.push(t.tip / length);
        toeAcross[k]!.push(t.across / length);
      });
    }

    // The neck's least girth between cervicale and the menton.
    const cervicale: number = (id.startsWith("f") ? 0.857 : 0.8639) * marks.statureMm;
    const menton: number = marks.statureMm - params.head.height;
    let neck: { girth: number; points: V3[] } | null = null;
    for (const region of ["head", "trunk"])
      for (const s of HumanReferenceSections.sections(id, region, [cervicale, menton])) {
        const pts: V3[] = [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points).filter((p: V3): boolean => Math.abs(p[2]) < 100);
        if (pts.length < 8) continue;
        const g: number = HumanReferenceSections.extent({ points: pts }).girth;
        if (neck === null || g < neck.girth) neck = { girth: g, points: pts };
      }
    if (neck !== null) {
      const e: HumanReferenceSections.IExtent = HumanReferenceSections.extent({ points: neck.points });
      const w: number = e.z[1] - e.z[0];
      const d: number = e.x[1] - e.x[0];
      const rhombus: number = 2 * Math.hypot(w, d);
      neckRatio.push(w / d);
      neckFullness.push((e.girth - rhombus) / (2 * (w + d) - rhombus));
    }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  console.log(`ankle least girth height: per malleolus height ${S.stat(ankleOverMalleolus, 3)}, per stature ${S.stat(ankleOverStature, 4)}`);
  console.log(`toes read per foot: ${S.stat(toeCount, 1)}`);
  toeTip.forEach((tips: number[], k: number): void => console.log(`toe ${k + 1} (medial to lateral): tip ${S.stat(tips, 4)}, across ${S.stat(toeAcross[k]!, 4)} (per foot length)`));
  console.log(`neck at least girth: breadth over depth ${S.stat(neckRatio, 3)}, fullness ${S.stat(neckFullness, 3)}`);
}
