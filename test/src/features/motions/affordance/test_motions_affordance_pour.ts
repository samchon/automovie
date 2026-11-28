import type { IAutoMovieMotionClock, IAutoMovieMotionHumanPour } from "@automovie/interface";
import {
  pourClock
} from "../../../../../packages/motions/src/affordance/internal/pourClock";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few sums and products of seconds. */
const ROUNDING: number = 1e-12;

/**
 * Check the pour stages and bounds on time, tilt and gap.
 *
 * Scenarios:
 *
 * 1. Lay out stages of 1, 0.5, 2, 0.5 and 1 s. Read all five start cues and
 *    the five-second end, then scale both cues and end by 1.5.
 * 2. Refuse one stage below 0.2 s, a scaled total above 10 s, tilt below 35
 *    degrees and gap above 0.18 m.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases give the authored stage intervals and the four rejected parameters.
 * @evidence contracts/development/testing.md#behavioral-verification The timetable receives a valid parameter record and one changed field for each refusal.
 * @evidence contracts/development/testing.md#independent-expectations Prefix sums of the authored stage lengths and the input tempo give the expected seconds.
 */
export async function test_motions_affordance_pour(): Promise<void> {
  const params: IAutoMovieMotionHumanPour.IParams = {
    source: "jug",
    target: "glass",
    tilt: 60,
    gap: 0.08,
    timing: { approach: 1, tip: 0.5, flow: 2, right: 0.5, retreat: 1 },
    sourceMl: 500,
    targetMl: 0,
    capacityMl: 300,
    transferMl: 200,
  };
  const starts: [string, number][] = [
    ["approachStart", 0],
    ["tipStart", 1],
    ["flowStart", 1.5],
    ["flowEnd", 3.5],
    ["retreatStart", 4],
  ];
  const laid = (clock: IAutoMovieMotionClock, scale: number): boolean =>
    nclose(clock.duration, 5 * scale, ROUNDING) &&
    starts.every(([name, seconds]: [string, number]): boolean =>
      nclose(clock.at(name), seconds * scale, ROUNDING),
    );

  // 1 and 2. The stages and their tempo.
  TestValidator.predicate("the stages", laid(pourClock(params, 1), 1));
  TestValidator.predicate(
    "a slower tempo",
    laid(pourClock(params, 1.5), 1.5),
  );

  // 3. The refusals.
  TestValidator.error("a stage too short", () =>
    pourClock({ ...params, timing: { ...params.timing, tip: 0.1 } }, 1),
  );
  TestValidator.error("a scaled sum too long", () => pourClock(params, 2.5));
  TestValidator.error("a tilt too shallow", () =>
    pourClock({ ...params, tilt: 20 }, 1),
  );
  TestValidator.error("a gap too wide", () =>
    pourClock({ ...params, gap: 0.3 }, 1),
  );
}
