import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Cervicale's share of stature by sex, ANSUR II (`docs/sources/ansur-ii-trunk-ratios.md`). */
const CERVICALE: Readonly<Record<"f" | "m", number>> = { f: 0.857, m: 0.8639 };

/** Stations as shares of the crotch-to-cervicale span. */
const SHARES: readonly number[] = Array.from({ length: 21 }, (_: unknown, i: number): number => i * 0.05);

/**
 * An estimate reading, not a check: the trunk's outlines in its own views,
 * from the private reference curves, normalized and aggregated over the four
 * people, as the knot table the trunk's view part reads.
 *
 * For each reference, the trunk is read on its horizontal sections from the
 * crotch (the pack's crotch cut) to cervicale (stature times ANSUR II's share
 * by sex), at each twentieth of that span: the skin's points within the
 * median region (the loop or arcs that cross the median plane, plus the arms'
 * loops where they have joined the trunk above the axilla) give the half
 * breadth (the greater of the two sides), the front and back forward places
 * relative to the back's point at cervicale's height, and each quarter's
 * conic shoulder (`HumanSectionShape`). Lengths are printed per stature; each
 * row prints the mean and SD over the people the station reads on, no
 * person's value and no curve.
 *
 * Scenarios:
 * 1. For each share of the crotch-to-cervicale span, prints the half breadth, the front and back forward places relative to cervicale's back point, all per stature, and the front and back quarters' shoulders.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) when present and prints the aggregate table; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the knot table it produces cites it and states its source as the private reference curves.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men; the spread shows how far one knot stands for the set.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_trunk_outline`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_trunk_outline(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_trunk_outline: no private curve pack in .references/curves; nothing read");
    return;
  }
  const half: number[][] = SHARES.map((): number[] => []);
  const front: number[][] = SHARES.map((): number[] => []);
  const back: number[][] = SHARES.map((): number[] => []);
  const shoulderFront: number[][] = SHARES.map((): number[] => []);
  const shoulderBack: number[][] = SHARES.map((): number[] => []);
  for (const id of ids) {
    const marks: HumanReferenceSections.ILandmarks = HumanReferenceSections.landmarks(id);
    const stature: number = marks.statureMm;
    const bottom: number = marks.crotchMm;
    const top: number = CERVICALE[id.startsWith("f") ? "f" : "m"] * stature;

    // The skin of a section near a height: every loop and arc of the trunk,
    // head and arm regions that crosses the median plane or, above the
    // axilla, touches the trunk's loop.
    const skin = (y: number): V3[] => {
      const rows: V3[] = [];
      for (const region of ["trunk", "head", "arm_l", "arm_r"])
        for (const s of HumanReferenceSections.sections(id, region, [y - 6, y + 6]))
          if (Math.abs(s.y - y) <= 5)
            for (const l of [...s.loops, ...s.arcs]) {
              const zs: number[] = l.points.map((p: V3): number => p[2]);
              const median: boolean = Math.min(...zs) < 0 && Math.max(...zs) > 0;
              if (median || region === "trunk" || region === "head") rows.push(...l.points);
            }
      return rows;
    };
    const top7: V3[] = skin(top).filter((p: V3): boolean => Math.abs(p[2]) <= 15);
    if (top7.length === 0) continue;
    const reference: number = Math.min(...top7.map((p: V3): number => p[0]));
    SHARES.forEach((share: number, k: number): void => {
      const shape: HumanSectionShape.IShape | null = HumanSectionShape.of(skin(bottom + share * (top - bottom)));
      if (shape === null) return;
      half[k]!.push(Math.max(shape.left, -shape.right) / stature);
      front[k]!.push((shape.front - reference) / stature);
      back[k]!.push((shape.back - reference) / stature);
      shoulderFront[k]!.push(shape.shoulder.front);
      shoulderBack[k]!.push(shape.shoulder.back);
    });
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  SHARES.forEach((share: number, k: number): void => {
    console.log(
      `trunk share ${share.toFixed(2)}: half breadth ${S.stat(half[k]!, 4)}; front ${S.stat(front[k]!, 4)}; back ${S.stat(back[k]!, 4)}; shoulder front ${S.stat(shoulderFront[k]!, 3)}, back ${S.stat(shoulderBack[k]!, 3)}`,
    );
  });
}
