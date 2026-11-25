import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanSegment,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";
import { readHumanSegmentAnchors } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one quintic, degrees. */
const ROUNDING: number = 1e-9;

/** A swivel course with no seed: the anchors alone are read. */
const NONE = (): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =>
  new Map();

/**
 * `readHumanSegmentAnchors` places a displayed second's arm fits on the anchor
 * course the performance prepared (`IPrepared.anchors`): a fit both anchors
 * around the second give on one branch lies on the minimum-jerk path through
 * its run of anchors (Flash and Hogan 1985), any other takes the nearer
 * anchor's seed.
 *
 * An action of 5 ms, shorter than one anchor spacing (1/7 s), has two anchors:
 * at its start and at its end. Their run of two is one rest-to-rest quintic, so
 * the middle is the mean of the two swivels.
 *
 * Scenarios:
 *
 * 1. Before the performance is prepared there is no anchor course.
 * 2. One branch: the start reads the first anchor's swivel, the middle the mean,
 *    20 degrees between 10 and 30.
 * 3. Two branches: the nearer anchor's seed, the first before the middle and the
 *    second after it.
 * 4. A fit only one anchor gives takes that one's seed.
 */
export function test_motions_perform_segment_anchors(): void {
  const seed = (swivel: number, branch: number): IAutoMovieSwivelSeed => ({
    swivel,
    branch,
  });
  const anchors: readonly IAutoMovieMotionHumanSegment.IAnchorFits[] = [
    new Map<string, IAutoMovieSwivelSeed | null>([
      ["leaf::leftArm", seed(10, 1)],
      ["leaf::rightArm", seed(40, 1)],
      ["carry::leftArm", seed(5, 1)],
    ]),
    new Map<string, IAutoMovieSwivelSeed | null>([
      ["leaf::leftArm", seed(30, 1)],
      ["leaf::rightArm", seed(80, 0)],
    ]),
  ];
  const cold: readHumanSegmentAnchors.IAnchored = {
    start: 1,
    plan: { duration: 0.005 },
  };
  const action: readHumanSegmentAnchors.IAnchored = {
    ...cold,
    prepared: { legs: NONE, swivels: NONE, stops: new Map(), anchors },
  };
  const swivel = (at: number, name: string): number =>
    readHumanSegmentAnchors(action, at)!.get(name)!.swivel;

  // 1. Unprepared.
  TestValidator.predicate(
    "no anchor course before the preparation",
    readHumanSegmentAnchors(cold, 1.001) === undefined,
  );

  // 2. One branch.
  TestValidator.predicate(
    "one branch lies on the quintic through its anchors",
    nclose(swivel(1, "leaf::leftArm"), 10, ROUNDING) &&
      nclose(swivel(1.0025, "leaf::leftArm"), 20, ROUNDING),
  );

  // 3. Two branches.
  TestValidator.predicate(
    "across branches the nearer anchor's seed",
    swivel(1.002, "leaf::rightArm") === 40 &&
      swivel(1.004, "leaf::rightArm") === 80,
  );

  // 4. One anchor's fit.
  TestValidator.predicate(
    "a fit of one anchor keeps its seed",
    swivel(1.004, "carry::leftArm") === 5,
  );
}
