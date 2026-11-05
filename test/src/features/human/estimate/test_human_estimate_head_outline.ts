import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Stations as shares of the menton-to-vertex height. */
const SHARES: readonly number[] = Array.from({ length: 21 }, (_: unknown, i: number): number => i * 0.05);

/**
 * An estimate reading, not a check: the head mass's outlines in its own views,
 * from the private reference curves, normalized by each person's head inputs
 * and aggregated over the four people.
 *
 * For each reference, the head's skin is read on its horizontal sections
 * (closed loops and open arcs of the head region) at each twentieth of the
 * height from menton (the vertex less the reference's own head height input)
 * to the vertex: the midline's front (P, the most anterior skin within 5 mm of
 * the median plane, nose and lips included) and back (B), each forward of the
 * skull's centre per head length, the skull's centre being the midpoint of P
 * and B at the station where they stand farthest apart (the head length's
 * level); the half breadth (L) per half the head breadth (eu-eu, the head
 * length times the cephalic index); and the front and back quarters' conic
 * shoulders (`HumanSectionShape`). Each row prints the mean and SD over the
 * people the station reads on, no person's value and no curve.
 *
 * Scenarios:
 * 1. For each share of the menton-to-vertex height, prints P and B per head length, L per half head breadth, and the front and back quarters' shoulders.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and the references' public head inputs (`HumanPeople.params`) and prints the aggregate table; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the knot table it produces cites it and states its source as the private reference curves.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men; the spread shows how far one knot stands for the set; the ears stand outside the median band and widen L where they reach.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_head_outline`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_head_outline(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_head_outline: no private curve pack in .references/curves; nothing read");
    return;
  }
  const P: number[][] = SHARES.map((): number[] => []);
  const B: number[][] = SHARES.map((): number[] => []);
  const L: number[][] = SHARES.map((): number[] => []);
  const shoulderFront: number[][] = SHARES.map((): number[] => []);
  const shoulderBack: number[][] = SHARES.map((): number[] => []);
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const vertex: number = HumanReferenceSections.landmarks(id).statureMm;
    const menton: number = vertex - params.head.height;
    const length: number = params.head.length;
    const halfBreadth: number = (params.head.length * params.head.cephalicIndex) / 100 / 2;
    const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, "head", [menton - 6, vertex + 6]);
    const at = (y: number): V3[] => {
      const near: HumanReferenceSections.ISection[] = rows.filter((s: HumanReferenceSections.ISection): boolean => Math.abs(s.y - y) <= 5);
      return near.flatMap((s: HumanReferenceSections.ISection): V3[] => [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points));
    };
    const midline = (points: V3[]): [number, number] | null => {
      const xs: number[] = points.filter((p: V3): boolean => Math.abs(p[2]) <= 5).map((p: V3): number => p[0]);
      return xs.length === 0 ? null : [Math.max(...xs), Math.min(...xs)];
    };

    // The skull's centre: P and B's midpoint where they stand farthest apart.
    let centre: number = NaN;
    let widest: number = 0;
    for (let y: number = menton + 0.5 * (vertex - menton); y <= vertex - 10; y += 5) {
      const m: [number, number] | null = midline(at(y));
      if (m !== null && m[0] - m[1] > widest) {
        widest = m[0] - m[1];
        centre = (m[0] + m[1]) / 2;
      }
    }
    if (!Number.isFinite(centre)) continue;
    SHARES.forEach((share: number, k: number): void => {
      const points: V3[] = at(menton + share * (vertex - menton));
      const m: [number, number] | null = midline(points);
      if (m !== null) {
        P[k]!.push((m[0] - centre) / length);
        B[k]!.push((m[1] - centre) / length);
      }
      const shape: HumanSectionShape.IShape | null = HumanSectionShape.of(points);
      if (shape === null) return;
      L[k]!.push(Math.max(shape.left, -shape.right) / halfBreadth);
      shoulderFront[k]!.push(shape.shoulder.front);
      shoulderBack[k]!.push(shape.shoulder.back);
    });
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  SHARES.forEach((share: number, k: number): void => {
    console.log(
      `head share ${share.toFixed(2)}: P ${S.stat(P[k]!, 4)}; B ${S.stat(B[k]!, 4)}; L ${S.stat(L[k]!, 4)}; shoulder front ${S.stat(shoulderFront[k]!, 3)}, back ${S.stat(shoulderBack[k]!, 3)}`,
    );
  });
}
