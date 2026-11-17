import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanSite, IAutoMovieRandom } from "@automovie/interface";
import { createAutoMovieRandom } from "@automovie/engine";
import { AutoMovieMotionHumanSite, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A contact's place is chosen among the places its target allows (#3357):
 * drawn by the seed among weighted places, and along a handle by end-state
 * comfort.
 *
 * Scenarios:
 * 1. Three places weighted 1, 2 and 1 drawn over 200 seeds: every draw is
 *    an allowed place; each place's count lies within three binomial
 *    standard deviations of its expected count; the same seed draws the
 *    same place.
 * 2. One place is always drawn; an empty set, a zero weight and a negative
 *    weight are each refused on `sites`.
 * 3. The grasp along a handle banded 0.2 to 0.8 m, on the four extreme
 *    bodies, for target heights from 0 to 2 m in 0.05 m steps: the grasp
 *    never rises as the target rises (end-state comfort), stays inside the
 *    band, equals the comfortable height less the target inside the band
 *    (1e-12 m), and holds the band's end beyond it; a taller body's
 *    comfortable height is higher than a shorter one's.
 * 4. A band whose low end lies above its high end is refused on `band`; a
 *    band of one point grasps that point.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public draw and grasp and reads their answers and refusals; a draw outside the set, a count off its expectation, a grasp that rises with the target or leaves its band fails with the case.
 * @evidence contracts/development/testing.md#independent-expectations The inverse relation is Cohen and Rosenbaum's; the count bound is three binomial deviations; the clamp and the refusals are the rule's own statements.
 * @evidence contracts/development/testing.md#distinguishing-cases Weighted and single sets, empty and non-positive weights, targets below, inside and above the band on four bodies, and a reversed and a one-point band.
 * @evidence contracts/development/testing.md#execution-ownership Prepares four polygon men and makes some 400 pure calls, under a second; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios.
 */
export function test_human_motion_core_site(): void {
  const complaints: string[] = [];
  const refused = (axis: string, run: () => unknown): boolean => {
    try {
      run();
      return false;
    } catch (error: unknown) {
      return error instanceof HumanRefusal && error.axis === axis;
    }
  };

  // 1. Weighted draws.
  const sites: IAutoMovieMotionHumanSite.IWeighted[] = [
    { id: "a", weight: 1 },
    { id: "b", weight: 2 },
    { id: "c", weight: 1 },
  ];
  const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
  const runs: number = 200;
  for (let i: number = 0; i < runs; i++) {
    const random: IAutoMovieRandom = createAutoMovieRandom(
      i.toString(16).padStart(16, "0"),
    );
    const id: string = AutoMovieMotionHumanSite.draw(sites, random, 0);
    if (counts[id] === undefined) complaints.push(`drew ${id}, not allowed`);
    else counts[id]! += 1;
    if (AutoMovieMotionHumanSite.draw(sites, random, 0) !== id)
      complaints.push(`seed ${i} drew two places`);
  }
  for (const site of sites) {
    const p: number = site.weight / 4;
    const expected: number = runs * p;
    const deviation: number = Math.sqrt(runs * p * (1 - p));
    if (Math.abs(counts[site.id]! - expected) > 3 * deviation)
      complaints.push(
        `${site.id} drawn ${counts[site.id]} times, expected ${expected} within ${(3 * deviation).toFixed(1)}`,
      );
  }

  // 2. A single place and the refusals.
  if (
    AutoMovieMotionHumanSite.draw(
      [{ id: "only", weight: 3 }],
      createAutoMovieRandom("00000000000000c8"),
      0,
    ) !== "only"
  )
    complaints.push("a single place was not drawn");
  const random: IAutoMovieRandom = createAutoMovieRandom("00000000000000c9");
  for (const [label, set] of [
    ["empty", []],
    ["zero", [{ id: "a", weight: 0 }]],
    ["negative", [{ id: "a", weight: -1 }]],
  ] as const)
    if (
      !refused("sites", (): string =>
        AutoMovieMotionHumanSite.draw(set, random, 0),
      )
    )
      complaints.push(`an ${label} set was not refused on sites`);

  // 3. End-state comfort on four bodies.
  const band: IAutoMovieMotionHumanSite.IBand = { low: 0.2, high: 0.8 };
  const comfort: Record<string, number> = {};
  for (const name of motionHumanBody.EXTREMES) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const c: number = AutoMovieMotionHumanSite.comfortable(body);
    comfort[name] = c;
    let previous: number = Infinity;
    for (let i: number = 0; i <= 40; i++) {
      const target: number = i * 0.05;
      const g: number = AutoMovieMotionHumanSite.grasp(band, target, c);
      if (g > previous + 1e-12)
        complaints.push(`${name}: the grasp rises at ${target.toFixed(2)} m`);
      if (g < band.low - 1e-12 || g > band.high + 1e-12)
        complaints.push(`${name}: the grasp ${g} leaves the band`);
      const free: number = c - target;
      const want: number =
        free < band.low ? band.low : free > band.high ? band.high : free;
      if (Math.abs(g - want) > 1e-12)
        complaints.push(
          `${name}: the grasp at ${target.toFixed(2)} m is ${g}, not ${want}`,
        );
      previous = g;
    }
  }
  if (!(comfort["m-large"]! > comfort["f-small"]!))
    complaints.push(
      `the tallest body's comfortable height ${comfort["m-large"]} is not above the shortest's ${comfort["f-small"]}`,
    );

  // 4. The band's own cases.
  if (
    !refused("band", (): number =>
      AutoMovieMotionHumanSite.grasp({ low: 0.6, high: 0.4 }, 1, 1),
    )
  )
    complaints.push("a reversed band was not refused on band");
  if (AutoMovieMotionHumanSite.grasp({ low: 0.5, high: 0.5 }, 0, 1.2) !== 0.5)
    complaints.push("a one-point band did not grasp its point");

  TestValidator.equals(
    "a contact's place is drawn among allowed places and chosen for the end posture",
    complaints,
    [],
  );
}
