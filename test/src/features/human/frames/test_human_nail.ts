import { AutoMovieEngineLoftChain } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanNail } from "@automovie/human";
import type { IAutoMovieHumanNail, IAutoMovieViewLoft } from "@automovie/interface";

/**
 * The nail law against closed forms, on one made digit: a level-topped bar along +X, 10 mm long, whose section is
 * `|y / 2.5|^8 + |z / 3.5|^8 = 1`, closed by that section shrunk over a quarter circle 4.6 mm long, with its distal segment's frame given
 * turned 0.2 rad about the long axis.
 *
 * Scenarios:
 * 1. The breadth is the section's extent along the turned frame's lateral direction, twice its support
 *    `((2.5 sin 0.2)^(8/7) + (3.5 cos 0.2)^(8/7))^(7/8)`; the tip stands 14.6 mm along; the width is 0.7 of the breadth and the
 *    proximal fold a width over 0.91 before the tip.
 * 2. The frame is rolled back by the turn it was given, -0.2 rad, and is not pitched: the bar's top is level across and along.
 * 3. The free edge stands where the top has fallen one fold and one thickness: `10 + 4.6 sin(acos(1 - 0.93 / 2.5))` mm.
 * 4. The plate has its own arc midway: there the bar's section is the straight bar's shrunk by `c`, the cosine of the closing turn,
 *    the plate's half width is `c W / 2`, and its greatest sagitta is the published circle's over that chord,
 *    `R - sqrt(R^2 - (c W / 2)^2)`, `R = 0.7 W`. The plate's stations stand a millimetre apart at most, so the one nearest midway
 *    holds at least `1 - (0.5 / 2.3)^2 = 0.95` of the published difference from the bed's own arc `c 2.5 (1 - (1 - (W / 7)^8)^(1/8))`;
 *    the tolerance is a twentieth of that difference and 0.02 mm. The lofted plate's crown lies one fold under the level top.
 * 8. The free edge's line follows the tip: the bar's plan contour is `x = 10 + 4.6 sqrt(1 - (z / 3.5)^2)`, and at half the half width
 *    aside the line stands the apex's distance from the tip behind it; a point 0.1 mm inside it is the nail's on both sides and one
 *    0.1 mm past it is not.
 * 5. The relief's net holds zero in its three outer rings, raises the skin nowhere by more than one thickness, and its greatest
 *    lowering lies between one fold (the skin one fold over the crown) and that plus the sagitta (the same at the edge).
 * 6. Red: a digit whose tip stands 4 mm from the joint is refused.
 * 7. The nail's region (`owns`): the plate's middle is the nail's; a point 0.2 mm beside the plate, one 0.2 mm behind the fold, one
 *    0.2 mm past the free edge and the digit's underside under the plate are not. The fold is a half ellipse a quarter of the width
 *    long: 0.8 of the half width aside, a point a twentieth of that length past the fold's apex is outside it
 *    (`sqrt(1 - 0.95^2) = 0.31 < 0.8`) and one at its centre is inside.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanNail.create` and lofts the plate it returns through `AutoMovieHumanConicLoft.create`.
 * @evidence contracts/development/testing.md#independent-expectations Every expectation is the made section's support function, the quarter circle, the circle's sagitta from the published radius, or a bound from the fold's definition; none is the law's own formula.
 * @evidence contracts/development/common.md#meaningful-documentation The bar fixture checks level orientation, breadth, free edge, plate arc, relief and ownership around the fold and sides, with a too-short digit refusal.
 */
export function test_human_nail(): void {
  const failures: string[] = [];
  const near = (label: string, got: number, want: number, tolerance: number): void => {
    if (!(Math.abs(got - want) <= tolerance)) failures.push(`${label}: ${got} against ${want} within ${tolerance}`);
  };
  const [high, broad, length, turned, fold, thickness]: [number, number, number, number, number, number] = [2.5, 3.5, 10, 0.2, 0.46, 0.47];
  // The closing quarter circle is 4.6 mm long: short enough that the proximal fold stands on the straight bar (1.2 mm before its end), and long enough that three cells of the net (1.38 mm) before the tip the top has fallen 0.71 mm, over
  // the fold the relief needs there, so the plate's line is not raised and the frame stays unpitched.
  const close: number = 4.6;
  const root = (x: number): number => Math.sign(x) * Math.abs(x) ** 0.25;
  const skin = (long: number): IAutoMovieHumanNail.ISkin => ({
    first: 0,
    tip: long + (close * Math.PI) / 2,
    point: (station: number, phase: number): number[] => {
      const turn: number = Math.max(0, station - long) / close;
      return [Math.min(station, long) + close * Math.sin(turn), high * Math.cos(turn) * root(Math.cos(phase)), broad * Math.cos(turn) * root(Math.sin(phase))];
    },
  });
  const proportions: IAutoMovieHumanNail.IProportions = { width: 0.7, aspect: 0.91, radius: 0.7, thickness, fold, lunula: 1, wrap: 1 };
  const segment: IAutoMovieHumanNail.IFrame = { origin: [0, 0, 0], distal: [1, 0, 0], dorsal: [0, Math.cos(turned), Math.sin(turned)] };
  const nail: IAutoMovieHumanNail.INail = AutoMovieHumanNail.create("nail.made", "nailbed.made", segment, skin(length), proportions, 0.69, 10);

  // 1. Breadth, tip, width and fold.
  const breadth: number = 2 * ((high * Math.sin(turned)) ** (8 / 7) + (broad * Math.cos(turned)) ** (8 / 7)) ** (7 / 8);
  const width: number = 0.7 * breadth;
  near("breadth", nail.readings.breadth, breadth, 2e-2);
  near("tip", nail.readings.tip, length + close, 1e-6);
  near("width", nail.readings.width, width, 2e-2);
  near("proximal fold", nail.readings.span[0], length + close - nail.readings.width / 0.91, 1e-3);

  // 2. The frame.
  near("roll", nail.readings.roll, -turned, 2e-3);
  near("pitch", nail.readings.pitch, 0, 1e-6);

  // 3. The free edge on the closing quarter circle.
  near("free edge", nail.readings.span[1], length + close * Math.sin(Math.acos(1 - (fold + thickness) / high)), 2e-3);

  // 4. The plate's own arc midway, in the readings. Midway the bar's section is shrunk by the cosine of the closing turn there.
  const arc: number = 0.7 * nail.readings.width;
  const shrunk: number = Math.sqrt(1 - (((nail.readings.span[0] + nail.readings.span[1]) / 2 - length) / close) ** 2);
  const bedArc: number = shrunk * high * (1 - (1 - (nail.readings.width / 2 / broad) ** 8) ** 0.125);
  const sagitta: number = arc - Math.sqrt(arc ** 2 - ((shrunk * nail.readings.width) / 2) ** 2);
  near("greatest sagitta", nail.readings.sagitta[1], sagitta, 0.05 * (sagitta - bedArc) + 0.02);
  const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(nail.plate, nail.plate.knots);
  if (loft.chain === null) failures.push("the plate does not loft: " + JSON.stringify(loft.diagnostics).slice(0, 300));
  else {
    const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const station: number = 9 - nail.plate.centres[0]![0];
    // The crown stands at phase 0 of the plate's chart; each edge is found by bisection of the phase on its side.
    const on = (phase: number): number[] => AutoMovieEngineLoftChain.point(chain, station, phase);
    near("crown under the skin", on(0)[1]!, high - fold, 1e-3);
  }

  // 8. The free edge's line: the bar's plan contour moved back by the apex's distance from the tip.
  const aside: number = 0.5 * (nail.readings.width / 2);
  const line: number = length + close * Math.sqrt(1 - (aside / broad) ** 2) - (length + close - nail.readings.span[1]);
  for (const side of [1, -1]) {
    if (!AutoMovieHumanNail.owns(nail, [line - 0.1, high, side * aside])) failures.push(`a point 0.1 mm inside the free edge's line, side ${side}, is not the nail's`);
    if (AutoMovieHumanNail.owns(nail, [line + 0.1, high, side * aside])) failures.push(`a point 0.1 mm past the free edge's line, side ${side}, is the nail's`);
  }

  // 5. The bed's net.
  const { rows, columns, heights }: { rows: number; columns: number; heights: number[] } = nail.bed;
  if (heights.length !== rows * columns) failures.push(`bed: ${heights.length} heights for ${rows} by ${columns}`);
  const outer: number = Math.max(...heights.map((h: number, i: number): number => (Math.floor(i / columns) < 3 || Math.floor(i / columns) >= rows - 3 || i % columns < 3 || i % columns >= columns - 3 ? Math.abs(h) : 0)));
  near("bed outer rings", outer, 0, 0);
  if (!(Math.max(...heights) <= thickness + 1e-9)) failures.push("the relief raises the skin over one thickness: " + Math.max(...heights));
  const deepest: number = -Math.min(...heights);
  if (!(deepest >= fold - 1e-2 && deepest <= fold + sagitta + 1e-2)) failures.push(`the relief's greatest lowering: ${deepest} outside ${fold} to ${fold + sagitta}`);

  // 7. The nail's region. The made frame comes back level, so a point is `[along, dorsal height, aside]`.
  const [w, back, front]: [number, number, number] = [nail.readings.width, nail.readings.span[0], nail.readings.span[1]];
  for (const [what, point, expected] of [
    ["the plate's middle", [back + w / 2, high, 0], true],
    ["a point beside the plate", [back + w / 2, high, w / 2 + 0.2], false],
    ["a point behind the fold", [back - 0.2, high, 0], false],
    ["a point in the fold's corner, outside its half ellipse", [back + 0.05 * (w / 4), high, 0.8 * (w / 2)], false],
    ["the same offset where the half ellipse has opened", [back + w / 4, high, 0.8 * (w / 2)], true],
    ["the digit's underside under the plate", [back + w / 2, -high, 0], false],
    ["a point past the free edge", [front + 0.2, high - fold - thickness, 0], false],
  ] as const)
    if (AutoMovieHumanNail.owns(nail, point) !== expected) failures.push(`${what} ${expected ? "is not" : "is"} the nail's`);

  // 6. Red: a digit too short for its nail.
  try {
    AutoMovieHumanNail.create("nail.short", "nailbed.short", segment, skin(-2), proportions, 0.69, 10);
    failures.push("a digit whose tip stands 4 mm from the joint was given a nail");
  } catch {
    // Refused, as it must be.
  }

  if (failures.length > 0) throw new Error("nail:\n" + failures.join("\n"));
}
