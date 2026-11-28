import { nclose } from "../../internal/predicates";
import { AutoMovieHumanNativeSiteReaches as Reaches } from "@automovie/human";
import type { AutoMovieVector2Tuple } from "@automovie/interface";

/**
 * A site's four reaches about a stated centre: the split of a depth and a breadth, tissue over bone, and an extreme carried between two
 * sets of reaches.
 *
 * The made section is a circle of radius 50 mm whose centre stands at [10, 0] in the chart, 10 mm forward of the course point: its
 * extremes are [60, 0], [10, 50], [-40, 0] and [10, -50], and every reach from the centre is 50.
 *
 * Scenarios:
 * 1. `split` of a depth 240 and a breadth 360 at shares 0.6 and 0.5 gives 144, 96, 180 and 180; the sums are the depth and the breadth.
 * 2. Tissue 1.2 with no bone takes every reach from 50 to 60; carried, the extremes stand at [70, 0], [10, 60], [-50, 0] and [10, -60]:
 *    the centre keeps its place. The same ratio taken about the course point would put the front at 72 and the back at -48, the centre
 *    at 12: the difference the law removes, written out as arithmetic.
 * 3. A bony part of 20 mm on both sides keeps 20 and scales the other 30: 56 to either side, the front and the back 60.
 * 4. Unequal changes (front 1.5, back 1, sides 1.2 and 1): a front extreme off the centre line, [60, 5], takes 1.5 along and the mean
 *    1.1 across, [85, 5.5]; a side extreme off it, [15, 50], takes the mean 1.25 along and 1.2 across, [16.25, 60].
 * 5. A ratio of one returns the given coordinates; shares outside (0, 1), a bony part past its reach, and nonpositive inputs are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production split, tissue and extreme on made numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every expectation is hand arithmetic on the circle's four extremes, written as literals with their derivation in the scenario list.
 * @evidence contracts/development/common.md#meaningful-documentation Depth and breadth splits, fixed bone and mobile tissue, asymmetric scaling, identity and invalid range choices are compared against explicit section coordinates.
 */
export function test_human_native_site_reaches(): void {
  const failures: string[] = [];
  const close = (what: string, got: number, expected: number): void => {
    if (!nclose(got, expected, 1e-12)) failures.push(`${what}: ${got} against ${expected}`);
  };
  const point = (what: string, got: AutoMovieVector2Tuple, expected: AutoMovieVector2Tuple): void => {
    close(what + " u", got[0], expected[0]);
    close(what + " v", got[1], expected[1]);
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
  const centre: AutoMovieVector2Tuple = [10, 0];
  const round: Reaches.IReaches = { front: 50, back: 50, lateral: 50, medial: 50 };
  const none: Reaches.IReaches = { front: 0, back: 0, lateral: 0, medial: 0 };

  // 1. The split.
  const hip: Reaches.IReaches = Reaches.split(240, 360, { front: 0.6, lateral: 0.5 });
  close("the front reach", hip.front, 144);
  close("the back reach", hip.back, 96);
  close("the lateral reach", hip.lateral, 180);
  close("the medial reach", hip.medial, 180);

  // 2. Tissue about the centre.
  const fuller: Reaches.IReaches = Reaches.tissue(round, none, 1.2);
  for (const name of ["front", "back", "lateral", "medial"] as const) close("the fuller " + name + " reach", fuller[name], 60);
  point("the fuller front extreme", Reaches.extreme([60, 0], "u", centre, round, fuller), [70, 0]);
  point("the fuller side extreme", Reaches.extreme([10, 50], "v", centre, round, fuller), [10, 60]);
  point("the fuller back extreme", Reaches.extreme([-40, 0], "u", centre, round, fuller), [-50, 0]);
  point("the fuller far side extreme", Reaches.extreme([10, -50], "v", centre, round, fuller), [10, -60]);

  // 3. Bone under the tissue.
  const boned: Reaches.IReaches = Reaches.tissue(round, { front: 0, back: 0, lateral: 20, medial: 20 }, 1.2);
  close("the boned lateral reach", boned.lateral, 56);
  close("the boned medial reach", boned.medial, 56);
  close("the boned front reach", boned.front, 60);

  // 4. Unequal sides.
  const uneven: Reaches.IReaches = { front: 75, back: 50, lateral: 60, medial: 50 };
  point("a front extreme off the centre line", Reaches.extreme([60, 5], "u", centre, round, uneven), [85, 5.5]);
  point("a side extreme off the centre line", Reaches.extreme([15, 50], "v", centre, round, uneven), [16.25, 60]);

  // 5. The identity and the refusals.
  point("an unchanged extreme", Reaches.extreme([60, 5], "u", centre, round, round), [60, 5]);
  refused("a share of one", (): unknown => Reaches.split(240, 360, { front: 1, lateral: 0.5 }));
  refused("a nonpositive depth", (): unknown => Reaches.split(0, 360, { front: 0.5, lateral: 0.5 }));
  refused("bone past its reach", (): unknown => Reaches.tissue(round, { ...none, front: 51 }, 1.2));
  refused("a nonpositive ratio", (): unknown => Reaches.tissue(round, none, 0));
  refused("a nonpositive reach", (): unknown => Reaches.extreme([60, 0], "u", centre, { ...round, back: 0 }, round));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
