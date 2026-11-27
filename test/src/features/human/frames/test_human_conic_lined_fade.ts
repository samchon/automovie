import { nclose } from "../../internal/predicates";
import { AutoMovieEngineViewChain } from "@automovie/engine";
import {
  AutoMovieHumanConicSection as S,
  AutoMovieHumanGrooveFade as Fade,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicSection,
  IAutoMovieViewChain,
} from "@automovie/interface";

/**
 * How a groove on a bilateral wall's back median may end along the wall, on one lined layout with no splice: the premise of fitting
 * the trunk whole on its lined layout.
 *
 * The plain section is bilateral: front extreme 120 mm, side extreme [20, 180], back extreme -90, medians 0.5, shoulders 0.45. The lined
 * layout is that layout with both medians freed into feature anchors and, before the back extreme, a crest and an inflection (the run
 * the trunk's lined layout holds for the spinal furrow and the natal cleft). The plain section converts onto it exactly, its two new
 * anchors lying on the smooth arc. The grooved section keeps every anchor but three: the crest stands at [-90, 22] heading straight
 * back along the outline, the inflection at [-85, 11] heading 30 degrees inward of it, and the back extreme on the groove's floor at
 * -80, so the floor lies 10 mm inside the line through the two crests. Both arcs of the groove have their tangent lines meeting ahead of
 * their starts by construction: the crest's and the floor's tangents are the lines `u = -90` and `u = -80`, which the inflection's
 * tangent crosses at `v = 11 + 5 sqrt(3)` and `v = 11 - 5 sqrt(3)`, between the crest and the inflection and between the inflection
 * and the floor.
 *
 * The wall is 120 mm long: the grooved section over its first 60 mm, then a fade over the next 60 by the quintic smoothstep, in two
 * ways. Blended, every field goes to the plain section's: the inflection's heading turns from 30 degrees inward to the smooth arc's
 * heading, outward of the floor's tangent, and on the way it is parallel to that tangent while the two points are not in line, where no
 * conic joins them. Narrowed, the groove keeps its form and shrinks: at width share `q` its half width is `22 q`, its depth `10 q^2`
 * and its inflection's turn `30 q` degrees, so the tangents' meetings stay between their anchors (`11 q -+ 5 q^2 cot(30 q degrees)`
 * lies inside `(0, 22 q)` for every `q` in `(0, 1]`).
 *
 * Scenarios:
 * 1. The converted plain section draws the plain chain: its radius at eight phases equals the plain layout's within 1e-9 mm.
 * 2. The grooved section passes through its made anchors and reaches 80 mm along the back median, 10 mm inside the plain section's 90.
 * 3. The blended fade is refused at one or more stations, all inside the fade, each by `the tangent lines meet behind`: the limit a
 *    fit must respect when a groove ends between two knots.
 * 4. The narrowed fade, from `q = 1` to `q = 0.25`, is admitted at every station read each millimetre, and the back median's reach is
 *    `90 - 10 q^2` there, rising without falling from 80 to 89.375. The groove's anchors and its width share along the wall are the
 *    production law's (`AutoMovieHumanGrooveFade.narrowed`, `anchors`, `share`), so the section model's admission is that law's check.
 * 5. The law's own conditions: the made groove (half 22, depth 10, turn 30 degrees) is admitted (`10 < 22 tan 30 = 12.70`) and holds
 *    at every width (`10 <= 22 pi / 6 = 11.52`); one 12 mm deep is admitted whole, does not hold, and at half width is not admitted
 *    (`3 > 11 tan 15 = 2.95`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds field vectors through the production layout, conversion and feature placement and reads the production chain's admission and radius.
 * @evidence contracts/development/testing.md#independent-expectations The groove's depth and the tangents' meetings are the made geometry's closed forms stated above; the plain section's radii are the plain layout's own chain, a second production path the lined layout must agree with.
 * @evidence contracts/development/testing.md#distinguishing-cases The plain section, the full groove, and 121 stations of the fade, the stretch where a groove's anchors pass from a concavity onto a smooth arc; all findings are collected.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous section arithmetic on made field vectors; no family, loft, fit or person.
 * @evidence contracts/development/common.md#meaningful-documentation States the made sections, the wall and each scenario's numbers.
 */
export function test_human_conic_lined_fade(): void {
  const failures: string[] = [];
  const base: IAutoMovieHumanConicSection.ILayout = S.bilateral(1);
  const runs: IAutoMovieHumanConicSection.IFeatureRun[] = [{ after: 3, anchors: [{ kind: "f", feature: "convex" }, { kind: "f", feature: "inflection" }] }];
  const freed: number[] = [1, 3];
  const lined: IAutoMovieHumanConicSection.ILayout = S.featured(base, runs, freed);
  const plain: number[] = [120, 0.5, 20, 180, 0.5, -90, 0.45, 0.45, 0.45, 0.45];
  const smooth: number[] = S.convert(plain, base, runs, freed);
  const radius = (values: readonly number[], layout: IAutoMovieHumanConicSection.ILayout, phase: number): number => {
    const section: IAutoMovieViewChain.ISection = S.chain(values, layout);
    return section.fault === null ? AutoMovieEngineViewChain.radius(section, phase) : NaN;
  };

  // 1. The conversion keeps the plain chain.
  for (let k: number = 0; k < 8; ++k) {
    const phase: number = (Math.PI * k) / 8 + 0.1;
    if (!nclose(radius(smooth, lined, phase), radius(plain, base, phase), 1e-9)) failures.push("the converted plain section left the plain chain at phase " + phase);
  }

  // A grooved section of width share `q`: the freed median before the run keeps its point and heading; the crest, the inflection and
  // the floor are made, the groove's half width `22 q`, its depth `10 q^2` and its inflection's turn `30 q` degrees.
  const { at, shoulders }: { at: number[]; shoulders: number } = S.offsets(lined);
  const input: IAutoMovieViewChain.IInput = S.resolve(smooth, lined).input;
  const side: AutoMovieVector2Tuple = input.points[2] as AutoMovieVector2Tuple;
  const full: Fade.IGroove = { half: 22, depth: 10, turn: Math.PI / 6 };
  if (!Fade.admitted(full) || !Fade.holds(full)) failures.push("the made groove (22, 10, 30 degrees) is not admitted at every width: 10 < 22 tan 30 and 10 <= 22 pi / 6");
  const steep: Fade.IGroove = { ...full, depth: 12 };
  if (!Fade.admitted(steep) || Fade.holds(steep) || Fade.admitted(Fade.narrowed(steep, 0.5))) failures.push("a groove 12 mm deep should be admitted whole (12 < 12.7), not held (12 > 11.5) and refused at half width (3 > 11 tan 15)");
  const groove = (q: number): { values: number[]; floor: AutoMovieVector2Tuple; crest: AutoMovieVector2Tuple; inflection: AutoMovieVector2Tuple } => {
    const { crest, inflection, heading: turned, floor }: Fade.IAnchors = Fade.anchors(Fade.narrowed(full, q), 90);
    const values: number[] = [...smooth];
    values[at[6]!] = floor[0];
    let previous: number = 0;
    for (const [k, point, heading] of [
      [3, input.points[3] as AutoMovieVector2Tuple, Math.atan2(input.tangents[3]![1], input.tangents[3]![0])],
      [4, crest, -Math.PI / 2],
      [5, inflection, turned],
    ] as [number, AutoMovieVector2Tuple, number][]) {
      const read: { values: [number, number, number]; t: number } = S.unplace(side, floor, point, heading, previous);
      read.values.forEach((value: number, j: number): void => {
        values[at[k]! + j] = value;
      });
      previous = read.t;
    }
    values[shoulders + 4] = 0.45;
    values[shoulders + 5] = 0.45;
    return { values, floor, crest, inflection };
  };
  const { values: grooved, floor, crest, inflection }: ReturnType<typeof groove> = groove(1);

  // 2. The grooved section stands on its made anchors and its floor.
  const made: IAutoMovieViewChain.IInput = S.resolve(grooved, lined).input;
  for (const [k, point] of [[4, crest], [5, inflection], [6, floor]] as [number, AutoMovieVector2Tuple][])
    if (!nclose(made.points[k]![0], point[0], 1e-9) || !nclose(made.points[k]![1], point[1], 1e-9)) failures.push("the grooved section's anchor " + k + " stands at " + JSON.stringify(made.points[k]) + ", not " + JSON.stringify(point));
  if (!nclose(radius(grooved, lined, Math.PI), 80, 1e-9)) failures.push("the groove's floor reaches " + radius(grooved, lined, Math.PI) + " mm, not 80");
  if (!nclose(radius(plain, base, Math.PI), 90, 1e-9)) failures.push("the plain section's back reaches " + radius(plain, base, Math.PI) + " mm, not 90");

  // 3. Fading by blending every field to the plain section's: refused on a stretch of the fade, by the tangents' meeting.
  const step = (s: number): number => {
    const t: number = Math.min(1, Math.max(0, (s - 60) / 60));
    return 10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5;
  };
  const blended: { station: number; fault: string }[] = [];
  for (let s: number = 0; s <= 120; ++s) {
    const values: number[] = smooth.map((x: number, k: number): number => x + (1 - step(s)) * (grooved[k]! - x));
    const section: IAutoMovieViewChain.ISection = S.chain(values, lined);
    if (section.fault !== null) blended.push({ station: s, fault: section.fault });
  }
  if (blended.length === 0) failures.push("the blended fade was admitted at every station: the chain no longer refuses a groove whose inflection turns through its neighbour's tangent");
  for (const { station, fault } of blended)
    if (station <= 60 || station === 120 || !fault.includes("the tangent lines meet behind")) failures.push("the blended fade was refused at station " + station + " otherwise than by the tangents' meeting inside the fade: " + fault);

  // 4. Fading by narrowing: admitted at every station, the floor at its closed-form depth.
  let before: number = 80;
  for (let s: number = 0; s <= 120; ++s) {
    const q: number = Fade.share(s, 60, 120, 0.25);
    const section: IAutoMovieViewChain.ISection = S.chain(groove(q).values, lined);
    if (section.fault !== null) {
      failures.push("the narrowing fade, station " + s + " (width share " + q.toFixed(3) + "): " + section.fault);
      continue;
    }
    const reach: number = AutoMovieEngineViewChain.radius(section, Math.PI);
    if (!nclose(reach, 90 - 10 * q * q, 1e-9)) failures.push("the narrowing fade, station " + s + ": the floor reaches " + reach + " mm, not " + (90 - 10 * q * q));
    if (reach < before - 1e-9) failures.push("the narrowing fade, station " + s + ": the back median's reach fell from " + before + " to " + reach);
    before = reach;
  }
  if (failures.length !== 0) throw new Error(failures.slice(0, 12).join("\n") + (failures.length > 12 ? "\n... " + (failures.length - 12) + " more" : ""));
}
