import { AutoMovieHumanNail } from "@automovie/human";
import type { IAutoMovieHumanNail } from "@automovie/interface";

/**
 * A nail's roll is the least of one objective: the skin's levelling against the prior that the nail lies in its segment's frame.
 *
 * Made digits: bars along +X, 10 mm long, whose section is the ellipse with half axes `a` across and `b` high, closed by that section
 * shrunk over a quarter circle 4.6 mm long, their distal segment's frame given turned 0.2 rad about the long axis. For an ellipse
 * turned by `p` from its own axes the top's heights at offsets `+e` and `-e` about its centre differ by `-2 B e / C`,
 * `B = sin p cos p (1 / a^2 - 1 / b^2)`, `C = sin^2 p / a^2 + cos^2 p / b^2`, whatever `e` is, so the mean levelling turn at a roll `r`
 * from the given frame is `g(r) = -atan(D / C)` at `p = r + 0.2`, `D = sin p cos p (1 / b^2 - 1 / a^2)`: level at `r = -0.2`, and near
 * level `-(1 - b^2 / a^2) p`. Every shrunk section is the same ellipse scaled, so every station reads the same turn. The roll must be
 * the least of `(g(r) / s)^2 + (r / t)^2` over a quarter turn either side, `s` the skin's error 0.17 mm over the plate's half width
 * (0.7 of half the breadth, which along the given frame's lateral is `2 sqrt(a^2 cos^2 0.2 + b^2 sin^2 0.2)`) and `t` the prior's
 * spread, 0.3 rad here. The test finds that least itself, on the closed form, ten thousand rolls a radian.
 *
 * Scenarios:
 * 1. A bar 3.5 mm across and 2 mm high: the roll is the closed form's least within 0.003 rad, short of the level roll -0.2 by what
 *    the prior takes; its conditioning is `1 - (2 / 3.5)^2 = 0.673` within 0.03.
 * 2. A nearly round bar, 3.5 by 3.43 mm, conditioning 0.04: the roll is the closed form's least within 0.003 rad and within 0.02 rad
 *    of the given frame, where the level roll is 0.2 rad away.
 * 3. The control, each bar made again with the prior removed (a spread of a million radians): the roll is then the bare level roll,
 *    -0.2 rad within 0.003, and it misses the objective's expectation by more than twice that tolerance (0.02 rad on the first bar,
 *    0.19 on the second, which so leaves its frame). The assertions of 1 and 2 would fail on it: the test tells the objective from
 *    the level roll alone.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanNail.create` on each made bar, with the prior and without, and reads the roll and the conditioning it reports. It catches a roll taken from a crossing of the levelling turn alone, a prior left out or weighed by another formula, and a round back turned to a far crossing.
 * @evidence contracts/development/testing.md#independent-expectations The levelling turn of an ellipse is derived above from its quadratic form; the objective is written out on that closed form in the test and its least found by the test's own scan; the breadth is the ellipse's support along the given lateral; the control's roll is the given turn undone. None is the law's reading of rings.
 * @evidence contracts/development/common.md#meaningful-documentation Two bars of different eccentricity and repeat reads with the prior removed check the chosen roll and its conditioning against explicit objectives.
 */
export function test_human_nail_roll(): void {
  const failures: string[] = [];
  const [length, close, turned, spread]: [number, number, number, number] = [10, 4.6, 0.2, 0.3];
  const proportions: IAutoMovieHumanNail.IProportions = { width: 0.7, aspect: 0.91, radius: 0.7, thickness: 0.47, fold: 0.46, lunula: 1, wrap: 1 };
  const segment: IAutoMovieHumanNail.IFrame = { origin: [0, 0, 0], distal: [1, 0, 0], dorsal: [0, Math.cos(turned), Math.sin(turned)] };
  for (const [what, across, high, near] of [
    ["the flat bar", 3.5, 2, false],
    ["the nearly round bar", 3.5, 3.43, true],
  ] as const) {
    const skin: IAutoMovieHumanNail.ISkin = {
      first: 0,
      tip: length + (close * Math.PI) / 2,
      point: (station: number, phase: number): number[] => {
        const turn: number = Math.max(0, station - length) / close;
        return [Math.min(station, length) + close * Math.sin(turn), high * Math.cos(turn) * Math.cos(phase), across * Math.cos(turn) * Math.sin(phase)];
      },
    };
    const half: number = 0.7 * Math.sqrt((across * Math.cos(turned)) ** 2 + (high * Math.sin(turned)) ** 2);
    const error: number = 0.17 / half;
    let [least, expected]: [number, number] = [Infinity, 0];
    for (let n: number = -15707; n <= 15707; ++n) {
      const p: number = n / 10000 + turned;
      const g: number = -Math.atan((Math.sin(p) * Math.cos(p) * (1 / high ** 2 - 1 / across ** 2)) / (Math.sin(p) ** 2 / across ** 2 + Math.cos(p) ** 2 / high ** 2));
      const cost: number = (g / error) ** 2 + (n / 10000 / spread) ** 2;
      if (cost < least) [least, expected] = [cost, n / 10000];
    }

    // 1 and 2. With the prior.
    const nail: IAutoMovieHumanNail.INail = AutoMovieHumanNail.create("nail.made", "nailbed.made", segment, skin, proportions, 0.69, spread);
    if (!(Math.abs(nail.readings.roll - expected) <= 3e-3)) failures.push(what + "'s roll: " + nail.readings.roll + " against " + expected);
    if (!(Math.abs(nail.readings.conditioning - (1 - (high / across) ** 2)) <= 3e-2)) failures.push(what + "'s conditioning: " + nail.readings.conditioning + " against " + (1 - (high / across) ** 2));
    if (near && !(Math.abs(nail.readings.roll) <= 0.02)) failures.push(what + " left its frame by " + nail.readings.roll + " rad");
    if (!near && !(Math.abs(nail.readings.roll + turned) <= 0.05)) failures.push(what + " stands " + (nail.readings.roll + turned) + " rad from its level roll");

    // 3. The control: the prior removed.
    const bare: IAutoMovieHumanNail.INail = AutoMovieHumanNail.create("nail.bare", "nailbed.bare", segment, skin, proportions, 0.69, 1e6);
    if (!(Math.abs(bare.readings.roll + turned) <= 3e-3)) failures.push(what + " without its prior: roll " + bare.readings.roll + " against the level roll " + -turned);
    if (!(Math.abs(bare.readings.roll - expected) > 6e-3)) failures.push(what + " without its prior is not told from the objective: " + bare.readings.roll + " against " + expected);
    if (near && !(Math.abs(bare.readings.roll) > 0.02)) failures.push(what + " without its prior stayed in its frame: " + bare.readings.roll);
  }
  if (failures.length > 0) throw new Error("nail roll:\n" + failures.join("\n"));
}
