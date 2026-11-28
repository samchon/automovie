import { nclose } from "../../internal/predicates";
import {
  AutoMovieHumanConicSection as S,
  AutoMovieHumanNativeGirthClosure as Closure,
  AutoMovieHumanNativeSiteReaches as Reaches,
  AutoMovieHumanNativeSiteSection as Site,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicSection,
} from "@automovie/interface";

/**
 * A section solved at its site: a girth changes its fullness and no reach, a breadth or a depth changes its reaches and no share,
 * tissue leaves the centre and the bone, and a site at its own measures returns the section as given.
 *
 * The made limb section is a circle of radius 50 mm about [10, 0] on `limb(0)`: extremes [60, 0], [10, 50], [-40, 0], [10, -50] and
 * four shoulders `sqrt(2) - 1`; its tape is `100 pi`. The made trunk section is `bilateral(1)`: front 120, side [20, 180], back -90,
 * medians 0.5, shoulders 0.45, with its centre at [15, 0].
 *
 * Scenarios:
 * 1. The site at its own reaches and no girth returns the given array itself: the consumer's f1 identity, bit for bit.
 * 2. A girth 7 % larger at the same reaches: the eight extreme coordinates are the given numbers, every shoulder has risen, and the
 *    solved section's tape is `107 pi` within 1e-6 mm of the closure's own tape of the given section times 1.07.
 * 3. Tissue 1.2 over a bony part of 20 mm on both sides, no girth: the extremes stand at [70, 0], [10, 56], [-50, 0], [10, -56] (the
 *    centre kept, the sides `20 + 1.2 x 30`), and the four shoulders are the given numbers.
 * 4. The trunk section 7 % broader, its depth held: the side extreme goes from [20, 180] to [20, 192.6], the front, the back, both
 *    medians and the four shoulders are the given numbers.
 * 5. The trunk section 10 % deeper in front only (front reach 105 to 115.5 about its centre): the front extreme stands at 130.5, the
 *    back at -90, and the side extreme's `u` moves by the mean of the two depth ratios, `15 + 1.05 x 5 = 20.25`.
 * 6. A layout with an inflection anchor, a centre off the median line of a reflected section, and a reflected section given two
 *    different side ratios are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production site section on made field vectors and measures the solved section through the production tape.
 * @evidence contracts/development/testing.md#independent-expectations Every moved coordinate is hand arithmetic on the made sections stated above; the girth's expectation is the asked tape; the untouched fields are compared with the given literals.
 * @evidence contracts/development/common.md#meaningful-documentation The cases separate unchanged section ownership, girth-only edits, tissue scaling over bone, directional width and depth and incompatible reflected inputs.
 */
export function test_human_native_site_section(): void {
  const failures: string[] = [];
  const close = (what: string, got: number, expected: number, tolerance: number = 1e-12): void => {
    if (!nclose(got, expected, tolerance)) failures.push(`${what}: ${got} against ${expected}`);
  };
  const refused = (what: string, bad: () => unknown): void => {
    let thrown: boolean = false;
    try {
      bad();
    } catch {
      thrown = true;
    }
    if (!thrown) failures.push(what + " was accepted");
  };
  const quarter: number = Math.SQRT2 - 1;
  const limb: IAutoMovieHumanConicSection.ILayout = S.limb(0);
  const circle: number[] = [60, 0, 10, 50, -40, 0, 10, -50, quarter, quarter, quarter, quarter];
  const centre: AutoMovieVector2Tuple = [10, 0];
  const round: Reaches.IReaches = { front: 50, back: 50, lateral: 50, medial: 50 };

  // 1. The identity.
  if (Site.solve(circle, limb, { centre, from: round, to: round }).values !== circle) failures.push("a site at its own measures did not return the given section");

  // 2. A girth alone.
  const own: number = Closure.tape(circle, limb);
  close("the made circle's tape", own, 100 * Math.PI, 1e-5 * 100 * Math.PI);
  const girthed: Site.ISolved = Site.solve(circle, limb, { centre, from: round, to: round, girth: 1.07 * own });
  for (let k: number = 0; k < 8; ++k) if (girthed.values[k] !== circle[k]) failures.push("a girth alone moved the extreme coordinate " + k);
  for (let k: number = 8; k < 12; ++k) if (!(girthed.values[k]! > circle[k]!)) failures.push("a larger girth did not raise the shoulder " + k);
  close("the girthed section's tape", Closure.tape(girthed.values, limb), 1.07 * own, 1e-6);
  if (!(girthed.fullness > 0)) failures.push("a larger girth gave the fullness " + girthed.fullness);

  // 3. Tissue over bone.
  const fuller: Reaches.IReaches = Reaches.tissue(round, { front: 0, back: 0, lateral: 20, medial: 20 }, 1.2);
  const tissued: Site.ISolved = Site.solve(circle, limb, { centre, from: round, to: fuller });
  [70, 0, 10, 56, -50, 0, 10, -56].forEach((x: number, k: number): void => close("the tissued extreme coordinate " + k, tissued.values[k]!, x));
  for (let k: number = 8; k < 12; ++k) if (tissued.values[k] !== circle[k]) failures.push("tissue moved the shoulder " + k);
  if (tissued.fullness !== 0) failures.push("tissue with no girth gave a fullness");

  // 4 and 5. The reflected trunk section: front, median, side u, side v, median, back, four shoulders.
  const half: IAutoMovieHumanConicSection.ILayout = S.bilateral(1);
  const trunk: number[] = [120, 0.5, 20, 180, 0.5, -90, 0.45, 0.45, 0.45, 0.45];
  const middle: AutoMovieVector2Tuple = [15, 0];
  const laid: Reaches.IReaches = { front: 105, back: 105, lateral: 180, medial: 180 };
  const broader: readonly number[] = Site.solve(trunk, half, { centre: middle, from: laid, to: { ...laid, lateral: 192.6, medial: 192.6 } }).values;
  [120, 0.5, 20, 192.6, 0.5, -90, 0.45, 0.45, 0.45, 0.45].forEach((x: number, k: number): void => close("the broader trunk's field " + k, broader[k]!, x));
  const deeper: readonly number[] = Site.solve(trunk, half, { centre: middle, from: laid, to: { ...laid, front: 115.5 } }).values;
  [130.5, 0.5, 20.25, 180, 0.5, -90, 0.45, 0.45, 0.45, 0.45].forEach((x: number, k: number): void => close("the deeper trunk's field " + k, deeper[k]!, x));

  // 6. Refusals.
  refused("a layout with an inflection anchor", (): unknown => Site.solve(circle, S.inflected(0, [0]), { centre, from: round, to: round }));
  refused("a centre off a reflected section's median line", (): unknown => Site.solve(trunk, half, { centre: [15, 3], from: laid, to: laid }));
  refused("two side ratios on a reflected section", (): unknown => Site.solve(trunk, half, { centre: middle, from: laid, to: { ...laid, lateral: 190 } }));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
