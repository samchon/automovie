import { AutoMovieHumanF1 } from "@automovie/human";
import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { nclose } from "../../internal/nclose";

/**
 * A nostril cutter drawn in for its rim keeps every section's four extremes: each moves along its own normal and stays the extreme.
 *
 * The cutter is drawn in by the width of its cut's blend so the opening, widened by the blend, keeps the hollow's size. A curve's parallel
 * at a distance has its `u` extremes on the normals through the curve's `u` extremes, which run along `u`, and likewise for `v`: an
 * extreme of the drawn-in section therefore keeps its other coordinate. It can move only while it still leads both its neighbours along
 * its own axis; past that it is no longer the section's extreme, and the conic chain through the four extremes folds at that quarter.
 *
 * Scenarios:
 *
 * 1. A made section whose front extreme leads its lateral neighbour by 0.2 mm, and the same section at twice the scale. Every extreme
 *    stays on its normal and keeps its lead. The back and lateral extremes have room for the full rim, whose width scales with the
 *    mean of the four guide reaches.
 * 2. The stored cutter: the same holds at every knot.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the drawn-in cutter through the public `AutoMovieHumanF1.CUTTERS[].cut`, the family the figure cuts with, on a made section and on the stored one.
 * @evidence contracts/development/testing.md#independent-expectations The parallel curve keeps the normal and the lead. The expected rim comes from the declared 1.5 mm per 5.02 mm of mean guide reach and the four given guide coordinates.
 * @evidence contracts/development/testing.md#distinguishing-cases The front's 0.2 mm lead limits its inset while the back and lateral guides take the full rim. Doubling the scale detects a fixed rim, and the stored cutter checks every knot.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit over one stored family's numbers, reached by `--include human_f1_nostril_rim`; it builds no person, surface or reference.
 * @evidence contracts/development/common.md#meaningful-documentation States the geometric identity, the two scenarios and the made defect's size.
 */
export function test_human_f1_nostril_rim(): void {
  const cutter = AutoMovieHumanF1.CUTTERS.find((candidate): boolean => candidate.family.name === "nostril");
  if (cutter === undefined) throw new Error("f1 has no nostril cutter");

  // 1. The four guide reaches are 5, 4, 6 and 5 mm before scaling.
  const section: number[] = [5, -1, -3, 4, -6, 2, 4.8, -5];
  for (const scale of [1, 2]) {
    const made: IAutoMovieHumanConicLoft.IFamily = {
      ...cutter.family,
      values: cutter.family.values.map((row: number[], f: number): number[] =>
        f < section.length ? row.map((): number => scale * section[f]!) : row,
      ),
    };
    const rim: number = 5 * scale * RIM_PER_REACH;
    const drawn: IAutoMovieHumanConicLoft.IFamily = cutter.cut(made);
    const found: string[] = faults(made, drawn, rim);
    TestValidator.predicate(`scale ${scale}: the guides keep their extremes: ${found.join(", ")}`, found.length === 0);
    TestValidator.predicate(`scale ${scale}: the back extreme comes in by the whole rim`, nclose(drawn.values[4]![0]!, -6 * scale + rim, 1e-9));
    TestValidator.predicate(`scale ${scale}: the lateral extreme comes in by the whole rim`, nclose(drawn.values[7]![0]!, -5 * scale + rim, 1e-9));
  }

  // 2. The stored cutter.
  const meanReach: number = [0, 3, 4, 7].reduce((sum, field): number =>
    sum + Math.abs(cutter.family.values[field]![0]!), 0,
  ) / 4;
  const stored: string[] = faults(cutter.family, cutter.cut(cutter.family), meanReach * RIM_PER_REACH);
  TestValidator.predicate("the stored nostril keeps its extremes when drawn in: " + stored.join("; "), stored.length === 0);
}

/** The declared rim share from the 1.5 mm accepted rim over the 5.02 mm reference reach. */
const RIM_PER_REACH: number = 1.5 / 5.02;

/**
 * Every extreme of a drawn-in four-extreme family that left its normal, moved outward or stopped leading a neighbour.
 *
 * @param before The family as stored: fields 0 to 7 are its front, medial, back and lateral extremes as `(u, v)` pairs.
 * @param after The family drawn in.
 * @param rim The expected full inset, mm.
 * @returns One line per fault, its knot first.
 */
function faults(before: IAutoMovieHumanConicLoft.IFamily, after: IAutoMovieHumanConicLoft.IFamily, rim: number): string[] {
  const names: string[] = ["front", "medial", "back", "lateral"];
  const out: string[] = [];
  before.knots.forEach((_: number, k: number): void => {
    for (let q: number = 0; q < 4; ++q) {
      // The front and back extremes are extremes of `u`, the medial and lateral ones of `v`; the first two are maxima.
      const axis: number = q % 2;
      const sign: number = q < 2 ? 1 : -1;
      const own = (family: IAutoMovieHumanConicLoft.IFamily, e: number, a: number): number => family.values[2 * e + a]![k]!;
      if (Math.abs(own(after, q, 1 - axis) - own(before, q, 1 - axis)) > 1e-9) out.push(`knot ${k}: the ${names[q]} extreme left its normal by ${(own(after, q, 1 - axis) - own(before, q, 1 - axis)).toFixed(3)} mm`);
      const moved: number = sign * (own(before, q, axis) - own(after, q, axis));
      if (moved <= 0 || moved > rim + 1e-9) out.push(`knot ${k}: the ${names[q]} extreme moved in by ${moved.toFixed(3)} mm`);
      for (const step of [1, 3]) {
        const lead: number = sign * (own(after, q, axis) - own(after, (q + step) % 4, axis));
        if (lead <= 0) out.push(`knot ${k}: the ${names[q]} extreme stands ${(-lead).toFixed(3)} mm behind the ${names[(q + step) % 4]} one`);
      }
    }
  });
  return out;
}
