import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Shares of the ear's height, lobule 0 to the helix's top 1. */
const SHARES: readonly number[] = Array.from({ length: 11 }, (_: unknown, i: number): number => i * 0.1);

/**
 * An estimate reading, not a check: the ear's lateral outline, from the
 * private reference curves, normalized by each person's ear inputs and
 * aggregated over the four people's eight ears.
 *
 * The ear stands out of the head's side, so its outline seen from the side is
 * the projection of its skin onto the sagittal plane, which the horizontal
 * sections give directly: at each height, the ear's skin is every head point
 * farther from the median plane than half the head breadth (eu-eu, input)
 * plus 3 mm, which no skull point reaches, so the outline read is the helix's
 * and lobule's rim standing clear of the head. The ear's band runs from its
 * lowest to its highest such point; at each tenth of that height the rim's
 * anterior and posterior places, relative to the band's mean, per ear
 * breadth (input), and the band's height per ear length (input, the check).
 * Each cell prints its mean and SD over the ears, no ear's value and no
 * curve.
 *
 * Limits: the rim close to the head (the ear's root, the tragus) stands
 * inside the threshold and is not read.
 *
 * Scenarios:
 * 1. Prints the band's height per ear length, then for each tenth of it the rim's anterior and posterior places per ear breadth.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and the references' public head inputs (`HumanPeople.params`) and prints the aggregate table; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the band's height against the ear length input checks the threshold.
 * @evidence contracts/testing.md#distinguishing-cases Both ears of two women and two men.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_ear_outline`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_ear_outline(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_ear_outline: no private curve pack in .references/curves; nothing read");
    return;
  }
  const height: number[] = [];
  const front: number[][] = SHARES.map((): number[] => []);
  const back: number[][] = SHARES.map((): number[] => []);
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const vertex: number = HumanReferenceSections.landmarks(id).statureMm;
    const half: number = (params.head.length * params.head.cephalicIndex) / 100 / 2;
    const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, "head", [vertex - params.head.height, vertex]);
    for (const [side, ear] of [
      [1, params.head.earPair.left],
      [-1, params.head.earPair.right],
    ] as const) {
      const band: { y: number; points: V3[] }[] = rows
        .map((s: HumanReferenceSections.ISection): { y: number; points: V3[] } => ({
          y: s.y,
          points: [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points).filter((p: V3): boolean => side * p[2] > half + 3),
        }))
        .filter((r: { y: number; points: V3[] }): boolean => r.points.length !== 0);
      if (band.length < 3) continue;
      const lo: number = band[0]!.y;
      const hi: number = band[band.length - 1]!.y;
      const xs: number[] = band.flatMap((r: { y: number; points: V3[] }): number[] => r.points.map((p: V3): number => p[0]));
      const mid: number = xs.reduce((a: number, b: number): number => a + b, 0) / xs.length;
      height.push((hi - lo) / ear.length);
      SHARES.forEach((share: number, k: number): void => {
        const y: number = lo + share * (hi - lo);
        const row: { y: number; points: V3[] } = band.reduce((a: { y: number; points: V3[] }, b: { y: number; points: V3[] }): { y: number; points: V3[] } =>
          Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a,
        );
        const rx: number[] = row.points.map((p: V3): number => p[0]);
        front[k]!.push((Math.max(...rx) - mid) / ear.breadth);
        back[k]!.push((Math.min(...rx) - mid) / ear.breadth);
      });
    }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  console.log(`ear band height per ear length: ${S.stat(height, 3)}`);
  SHARES.forEach((share: number, k: number): void => console.log(`ear share ${share.toFixed(1)}: anterior ${S.stat(front[k]!, 3)}, posterior ${S.stat(back[k]!, 3)} (per ear breadth)`));
}
