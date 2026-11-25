import type { IAutoMovieMotionClock, IAutoMovieMotionHumanPour } from "@automovie/interface";
import { pourClock } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums and products of seconds. */
const ROUNDING: number = 1e-12;

/**
 * `pourClock` lays the pour's five authored stages end to end, each scaled by
 * the tempo, after admitting each stage to 0.2 to 3 s, their sum and its
 * scaled sum to 10 s, the tilt to 35 to 90 degrees and the gap to 0.04 to
 * 0.18 m.
 *
 * Scenarios:
 *
 * 1. Stages of 1, 0.5, 2, 0.5 and 1 s start at 0, 1, 1.5, 3.5 and 4 s and end at
 *    5 s.
 * 2. A tempo of 1.5 stretches every start and the end by 1.5.
 * 3. A stage under 0.2 s, a scaled sum over 10 s, a tilt under 35 degrees and a
 *    gap over 0.18 m are each refused.
 */
export async function test_unit_motions_affordance_pour(): Promise<void> {
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
