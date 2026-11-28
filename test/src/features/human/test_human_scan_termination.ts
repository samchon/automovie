import {
  AutoMovieHumanConicSection,
  AutoMovieHumanDigitStations,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicSection,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Human's scans that stop only on a condition end when the condition can
 * never hold: a digit's station walk whose step cannot advance, and a
 * section ring's search for an anchor no anchor of the ring satisfies.
 *
 * Scenarios:
 * 1. A digit from 0 mm to a cap at 20.5 mm with no joint and no relief
 *    window stands every `STEP` (2 mm) up to 2.5 mm short of the cap, then
 *    its three tip rings at 1.2, 0.3 and 0 mm before it: 0 to 16 by 2, then
 *    19.3, 20.2 and 20.5.
 * 2. A relief window of zero half width, one of negative half width, one
 *    of not-a-number half width, and one so narrow (1e-300 mm) that its
 *    quarter is under half an ulp of the arc length are refused, as are a
 *    first section of minus infinity and a cap of not-a-number. Before,
 *    each but the not-a-number window left the walk standing forever.
 * 3. A ring frame: in `[u, f, f, v]` both features stand between anchors
 *    0 and 3, and in `[f, u, f, v]` the first feature's frame wraps round
 *    the ring's end to `[3, 1]`.
 * 4. A ring with no `u` or `v` anchor frames no feature and is refused,
 *    where the search circled the ring forever.
 * 5. Resolved neighbours: with anchors 0 and 3 of four resolved, anchors 1
 *    and 2 stand between them; with only anchor 2 resolved, anchor 0's
 *    neighbours are 2 on both sides; with none resolved the search is
 *    refused, where it circled the ring forever.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls Human's public station walk, frame and neighbour search with ordinary and degenerate inputs; a walk or search that circles never returns, and one that refuses or moves an ordinary input fails scenarios 1, 3 and 5. The fixtures vary station window widths and ends, ring closure and extrema, and the availability of neighbouring frames.
 * @evidence contracts/development/testing.md#independent-expectations Stations follow from the documented 2 mm spacing and tip rings by hand; frames and neighbours from the ring's order by inspection.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scans and the five scenarios.
 */
export function test_human_scan_termination(): void {
  const findings: string[] = [];
  const refused = (label: string, run: () => unknown): void => {
    try {
      findings.push(`${label}: returned ${JSON.stringify(run())}`);
    } catch (error) {
      if (!(error instanceof Error))
        findings.push(`${label}: threw ${String(error)}`);
    }
  };
  const same = (
    label: string,
    got: readonly number[],
    want: readonly number[],
  ): void => {
    if (
      got.length !== want.length ||
      got.some(
        (v: number, i: number): boolean => Math.abs(v - want[i]!) > 1e-12,
      )
    )
      findings.push(
        `${label}: ${JSON.stringify(got)}, not ${JSON.stringify(want)}`,
      );
  };

  // 1-2. The station walk.
  same(
    "stations",
    AutoMovieHumanDigitStations.of(0, 20.5, [], []),
    [0, 2, 4, 6, 8, 10, 12, 14, 16, 19.3, 20.2, 20.5],
  );
  for (const half of [0, -1, NaN, 1e-300])
    refused(`window half ${half}`, () =>
      AutoMovieHumanDigitStations.of(0, 20.5, [], [{ at: 5, half }]),
    );
  refused("first -Infinity", () =>
    AutoMovieHumanDigitStations.of(-Infinity, 20.5, [], []),
  );
  refused("cap NaN", () => AutoMovieHumanDigitStations.of(0, NaN, [], []));

  // 3-4. The frame of a feature.
  const ring = (
    ...kinds: IAutoMovieHumanConicSection.IAnchor["kind"][]
  ): IAutoMovieHumanConicSection.ILayout => ({
    anchors: kinds.map(
      (
        kind: IAutoMovieHumanConicSection.IAnchor["kind"],
      ): IAutoMovieHumanConicSection.IAnchor => ({ kind }),
    ),
    mirror: false,
  });
  same(
    "frame of 1 in u f f v",
    AutoMovieHumanConicSection.frame(1, ring("u", "f", "f", "v")),
    [0, 3],
  );
  same(
    "frame of 2 in u f f v",
    AutoMovieHumanConicSection.frame(2, ring("u", "f", "f", "v")),
    [0, 3],
  );
  same(
    "frame of 0 in f u f v",
    AutoMovieHumanConicSection.frame(0, ring("f", "u", "f", "v")),
    [3, 1],
  );
  refused("frame without extremes", () =>
    AutoMovieHumanConicSection.frame(0, ring("f", "m", "f")),
  );

  // 5. The resolved neighbours.
  const p: AutoMovieVector2Tuple = [0, 0];
  same(
    "neighbours of 1",
    AutoMovieHumanConicSection.neighbours(1, [p, null, null, p]),
    [0, 3],
  );
  same(
    "neighbours of 2",
    AutoMovieHumanConicSection.neighbours(2, [p, null, null, p]),
    [0, 3],
  );
  same(
    "neighbours of 0",
    AutoMovieHumanConicSection.neighbours(0, [null, null, p, null]),
    [2, 2],
  );
  refused("neighbours unresolved", () =>
    AutoMovieHumanConicSection.neighbours(0, [null, null, null]),
  );

  TestValidator.equals("each scan ends", findings, []);
}
