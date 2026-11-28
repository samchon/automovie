import { AutoMovieHumanCourseRuns as Runs } from "@automovie/human";
import type {
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
} from "@automovie/interface";

/**
 * A course's runs and the material map that carries a station by its run and tau.
 *
 * Scenarios:
 * 1. On a made L-shaped two-run course (100 mm along +X, then 50 mm along +Y, no turn) the station nearest [40, 7, 0] is 40, nearest the
 *    corner is 100, and the run ends are [0, 100, 150].
 * 2. Scaling the first run by 1.2 and keeping the second's length gives runs [0, 120, 170]: a station in the scaled run scales (50 to 60),
 *    one in the next run translates by 20 (130 to 150), and the end runs extend their own linear maps (160 to 180, -10 to -12).
 * 3. Equal runs give the shared identity, which returns odd doubles bit for bit.
 * 4. The extreme scan returns the first maximum of a made parabola on its grid, and the least of its negation.
 * 5. Made defects are refused: non-increasing runs, unequal run counts, an empty finite window.
 * 6. The exact run ends of a right-angle course of two 100 mm runs with a 10 mm half length: the corner's station is 110 less the turn's
 *    set-back and the course ends at twice that; a straight three-centre course keeps [0, 100, 150].
 * 7. The smooth map from [0, 100, 150] to [0, 120, 170] with a 10 mm window: every run end goes to its run end, the slope is the solved
 *    ratio `k0` at the window's start, `k1` at its end and their mean at the joint, the second derivative is zero at both window ends and
 *    `(k1 - k0) 30 / 16 / 20` at the joint, value and slope are continuous across the window ends, and the map rises over the whole
 *    course. Equal runs return the shared identity with the jet [s, 1, 0]; overlapping windows and a map that would not rise are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production nearest, ends, map and extreme on made axes and runs, reading their returned stations.
 * @evidence contracts/development/testing.md#independent-expectations Every expected station is the closed form of the made polyline and the piecewise-linear tau map, written by hand.
 * @evidence contracts/development/common.md#meaningful-documentation The made courses test nearest stations, run remapping, exact identity, grid extrema, invalid run arrays, and smooth station and derivative checks through a corner.
 */
export function test_human_course_runs(): void {
  const failures: string[] = [];
  const near = (what: string, got: number, want: number, tolerance: number): void => {
    if (!(Math.abs(got - want) <= tolerance)) failures.push(`${what}: ${got} instead of ${want}`);
  };
  const frame = (origin: [number, number, number]): IAutoMovieLoftSectionFrame => ({ origin, u: [0, 0, 1], v: [0, 1, 0] });
  const axis: IAutoMovieViewAxis.IAxis = {
    at: (s: number): IAutoMovieLoftSectionFrame => (s <= 100 ? frame([s, 0, 0]) : frame([100, s - 100, 0])),
  };
  const centres: [number, number, number][] = [
    [0, 0, 0],
    [100, 0, 0],
    [100, 50, 0],
  ];

  // 1. Nearest stations and run ends. Beside a run the distance is flat at its minimum, 7 + (s - 40)^2 / 14, so a double resolves the
  // station only to about sqrt(14 * 7 * 2^-52) = 1.5e-7 mm; at the corner the distance is a V and the station is exact.
  near("nearest to [40, 7, 0]", Runs.nearest(axis, 150, [40, 7, 0]), 40, 1e-6);
  near("nearest to the corner", Runs.nearest(axis, 150, [100, 0, 0]), 100, 1e-9);
  const ends: number[] = Runs.ends(axis, centres);
  [0, 100, 150].forEach((want: number, k: number): void => near("run end " + k, ends[k]!, want, 1e-9));

  // 2. The first run scaled by 1.2, the second kept: its stations translate.
  const map: (s: number) => number = Runs.map([0, 100, 150], [0, 120, 170]);
  for (const [s, want] of [
    [50, 60],
    [130, 150],
    [160, 180],
    [-10, -12],
  ] as const)
    near("mapped " + s, map(s), want, 1e-12);

  // 3. Identity.
  const same: (s: number) => number = Runs.map([0, 100.1, 150.3], [0, 100.1, 150.3]);
  if (same !== Runs.identity) failures.push("equal runs did not return the shared identity");
  for (const s of [0.1 + 0.2, 104.00000000000001, Math.PI * 100]) if (!Object.is(same(s), s)) failures.push("identity changed " + s);

  // 4. Extremes on the 1 mm grid: the parabola peaks at 37.5, read equal at 37 and 38, and the earlier is kept.
  near("extreme maximum", Runs.extreme((s: number): number => -((s - 37.5) ** 2), 0, 100, 1, 1), 37, 0);
  near("extreme minimum", Runs.extreme((s: number): number => (s - 37.5) ** 2, 0, 100, 1, -1), 37, 0);

  // 5. Defects.
  const refuses = (what: string, call: () => unknown): void => {
    try {
      call();
      failures.push(what + " was accepted");
    } catch {
      // refused as required
    }
  };
  refuses("non-increasing runs", (): unknown => Runs.map([0, 100, 150], [0, 160, 150]));
  refuses("unequal run counts", (): unknown => Runs.map([0, 100, 150], [0, 150]));
  refuses("a window with no finite reading", (): unknown => Runs.extreme((): number => NaN, 0, 10, 1, 1));

  // 6. Exact run ends. A right-angle course of two 100 mm runs with a turn of half length 10: by the turn's symmetry its displacement
  // is d (t_in + t_out), and each straight run loses the set-back d, so the corner's station is (100 - d) + 10 and the course ends at
  // 2 (100 - d) + 20. The set-back is the engine's own; a straight three-centre course has none.
  const corner: number[] = Runs.joints([[0, 0, 0], [100, 0, 0], [100, 100, 0]], [10]);
  const setback: number = 110 - corner[1]!;
  if (!(setback > 10 && setback < 12.5)) failures.push(`right-angle set-back ${setback} is not between its half length and 5/4 of it`);
  near("course end past a turn", corner[2]!, 2 * (100 - setback) + 20, 1e-9);
  const straight: number[] = Runs.joints([[0, 0, 0], [100, 0, 0], [150, 0, 0]], [7]);
  [0, 100, 150].forEach((want: number, k: number): void => near("straight run end " + k, straight[k]!, want, 1e-12));

  // 7. The smooth map on runs [0, 100, 150] to [0, 120, 170] with a 10 mm window at 100. With c = 10 * 5 / 32 and d = k1 - k0, the two
  // run equations 100 k0 + c d = 120 and 50 k1 - c d = 50 give d = -0.2 / (1 - 3 c / 100).
  const c: number = (10 * 5) / 32;
  const d: number = -0.2 / (1 - (3 * c) / 100);
  const [k0, k1] = [(120 - c * d) / 100, (50 + c * d) / 50];
  const smooth: Runs.IMap = Runs.smooth([0, 100, 150], [0, 120, 170], [10]);
  for (const [s, want] of [
    [0, 0],
    [100, 120],
    [150, 170],
    [50, 50 * k0],
    [90, 90 * k0],
    [110, 170 - 40 * k1],
    [160, 170 + 10 * k1],
  ] as const)
    near("smooth " + s, smooth(s), want, 1e-10);
  for (const [s, slope] of [
    [90, k0],
    [110, k1],
    [100, (k0 + k1) / 2],
  ] as const)
    near("smooth slope at " + s, smooth.jet(s)[1], slope, 1e-12);
  near("smooth bend at the window's start", smooth.jet(90)[2], 0, 1e-15);
  near("smooth bend at the window's end", smooth.jet(110)[2], 0, 1e-15);
  near("smooth bend at the joint", smooth.jet(100)[2], ((k1 - k0) * 30) / 16 / 20, 1e-12);

  // Either side of each window end the value and slope agree, and the map rises everywhere.
  for (const edge of [90, 110]) {
    near("smooth value across " + edge, smooth(edge + 1e-9) - smooth(edge - 1e-9), 0, 1e-8);
    near("smooth slope across " + edge, smooth.jet(edge + 1e-9)[1] - smooth.jet(edge - 1e-9)[1], 0, 1e-8);
  }
  for (let s: number = -10; s < 160; s += 0.5) if (!(smooth(s + 0.5) > smooth(s))) failures.push("the smooth map does not rise at " + s);
  if (Runs.smooth([0, 100.1, 150.3], [0, 100.1, 150.3], [10]) !== Runs.identity) failures.push("equal runs did not return the shared identity from the smooth map");
  if (!Object.is(Runs.identity(0.1 + 0.2), 0.1 + 0.2) || Runs.identity.jet(7)[1] !== 1 || Runs.identity.jet(7)[2] !== 0) failures.push("the identity map's jet is not [s, 1, 0]");
  refuses("overlapping windows", (): unknown => Runs.smooth([0, 100, 150], [0, 120, 170], [60]));
  refuses("a map that would not rise", (): unknown => Runs.smooth([0, 100, 150], [0, 1, 170], [49]));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
