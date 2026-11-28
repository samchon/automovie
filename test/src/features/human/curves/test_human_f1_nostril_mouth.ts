import { AutoMovieHumanF1 } from "@automovie/human";
import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Every section of f1's nostril cutter whose plane reaches the nostril's closed levels keeps its front within the nostril's own front.
 *
 * The reference's nostril is a closed level loop from 1,551 mm up, whose front stands 127.7 mm forward at 1,552 mm (the level scan that
 * `test/src/reference-conics/FamilyConicBody.ts` records for its `nostril` part). A section of the cutter whose plane reaches 1,551 mm
 * cuts that loop, and its front extreme may stand past the loop's front by no more than the cutter's own stated fit error to the
 * reference's hull, 1.46 mm. A section past it is the hull of other skin, such as the open floor round the nostril, and its cut draws an
 * opening of that skin's outline instead of the nostril's.
 *
 * Scenarios:
 *
 * 1. The stored cutter: every knot whose plane, normal to its straight course, reaches 1,551 mm at its front extreme has that extreme at
 *    most 127.7 + 1.46 mm forward.
 * 2. A made defect: the same cutter with its mouth knot's front extreme put back at 8.24 mm, the value fitted to the floor's hull, stands
 *    3.7 mm past the nostril's front and is reported.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the stored cutter through the public `AutoMovieHumanF1.CUTTERS` and places each knot's front extreme on its own course and chart, so a section fitted to the floor fails.
 * @evidence contracts/development/testing.md#independent-expectations The limit is the reference nostril's front at its closed levels (a recorded level scan) plus the cutter's stated hull error; the plane's heights follow from the course's direction alone.
 * @evidence contracts/development/common.md#meaningful-documentation The stored cutter and a modified mouth are tested against the same recorded nostril limit. The modified knot must specifically be detected at 9 mm.
 */
export function test_human_f1_nostril_mouth(): void {
  const stored: IAutoMovieHumanConicLoft.IFamily | undefined = AutoMovieHumanF1.CUTTERS.map(
    (cutter): IAutoMovieHumanConicLoft.IFamily => cutter.family,
  ).find((family: IAutoMovieHumanConicLoft.IFamily): boolean => family.name === "nostril");
  if (stored === undefined) throw new Error("f1 has no nostril cutter");

  // 1. The stored cutter.
  const found: string[] = past(stored);
  TestValidator.predicate("every nostril section that reaches the nostril stands within its front: " + found.join("; "), found.length === 0);

  // 2. The made defect: the mouth knot fitted to the floor's hull again.
  const mouth: number = stored.knots.indexOf(9);
  if (mouth < 0) throw new Error("the nostril cutter has no knot at 9 mm");
  const defect: IAutoMovieHumanConicLoft.IFamily = {
    ...stored,
    values: stored.values.map((row: number[], f: number): number[] => (f === 0 ? row.map((x: number, k: number): number => (k === mouth ? 8.24 : x)) : row)),
  };
  TestValidator.predicate("a mouth fitted to the floor's hull is reported", past(defect).some((line: string): boolean => line.startsWith("9 mm")));
}

/** Lowest level of the nostril's closed loop, mm. */
const LOWEST_MM: number = 1551;

/** The nostril's front at its closed levels, mm forward, and the cutter's stated largest fit error to the reference's hull, mm. */
const FRONT_MM: number = 127.7;
const HULL_MM: number = 1.46;

/**
 * Each knot of a straight-coursed cutter whose front extreme reaches the nostril's lowest closed level and stands past its front.
 *
 * @param family The cutter: two centres, its chart's `up`, its front extreme's `u` in the first row.
 * @returns One line per such knot, its station first.
 */
function past(family: IAutoMovieHumanConicLoft.IFamily): string[] {
  const [a, b] = family.centres as [number, number, number][];
  const length: number = Math.hypot(b![0] - a![0], b![1] - a![1], b![2] - a![2]);
  const d: number[] = [0, 1, 2].map((i: number): number => (b![i]! - a![i]!) / length);
  // The chart's u: `up` made square to the course, as a straight course carries it.
  const along: number = family.up[0] * d[0]! + family.up[1] * d[1]! + family.up[2] * d[2]!;
  const raw: number[] = [0, 1, 2].map((i: number): number => family.up[i]! - along * d[i]!);
  const size: number = Math.hypot(raw[0]!, raw[1]!, raw[2]!);
  const u: number[] = raw.map((x: number): number => x / size);
  if (Math.abs(d[2]!) > 1e-9 || Math.abs(u[2]!) > 1e-9) throw new Error("the nostril's course or chart leaves its sagittal plane, so v moves x");
  const out: string[] = [];
  family.knots.forEach((s: number, k: number): void => {
    const front: number = family.values[0]![k]!;
    // The front extreme stands at `front` along u; v is square to the course and to u, both upright here, so it moves neither x nor y.
    const x: number = a![0] + s * d[0]! + front * u[0]!;
    const y: number = a![1] + s * d[1]! + front * u[1]!;
    if (y >= LOWEST_MM && x > FRONT_MM + HULL_MM) out.push(`${s} mm: front at x ${x.toFixed(2)} mm, ${(x - FRONT_MM).toFixed(2)} mm past the nostril's front`);
  });
  return out;
}
