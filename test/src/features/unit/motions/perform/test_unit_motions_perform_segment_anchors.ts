import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanSegment,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";
import { readHumanSegmentAnchors } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { syntheticHumanSegment } from "../../../internal/synthetic/syntheticHumanSegment";

/** Rounding of one quintic, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `readHumanSegmentAnchors` places a displayed second's arm fits on the anchor
 * course the performance prepared (`IPrepared.anchors`): a fit both anchors
 * around the second give on one branch lies on the minimum-jerk path through
 * its run of anchors (Flash and Hogan 1985), any other takes the nearer
 * anchor's seed.
 *
 * An action of 5 ms, shorter than one anchor spacing, has two anchors: at its
 * start and at its end. Their run of two is one rest-to-rest quintic, so the
 * middle is the mean of the two swivels.
 *
 * Scenarios:
 *
 * 1. Before the performance is prepared there is no anchor course.
 * 2. One branch: the start reads the first anchor's swivel, the middle the
 *    mean, 20 degrees between 10 and 30.
 * 3. Two branches: the nearer anchor's seed, the first before the middle and
 *    the second after it.
 * 4. A fit only one anchor gives takes that one's seed.
 */
export function test_unit_motions_perform_segment_anchors(): void {
  const segment: IAutoMovieMotionHumanSegment = syntheticHumanSegment({
    entryTime: 1,
    end: 1.005,
    duration: 0.005,
  });

  // 1. Unprepared.
  TestValidator.predicate(
    "no anchor course before the preparation",
    readHumanSegmentAnchors(segment, 1.001) === undefined,
  );

  const seed = (swivel: number, branch: 1 | -1): IAutoMovieSwivelSeed => ({
    swivel,
    branch,
  });
  segment.prepared = {
    legs: (): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =>
      new Map(),
    swivels: (): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =>
      new Map(),
    stops: new Map(),
    anchors: [
      new Map<string, IAutoMovieSwivelSeed | null>([
        ["leaf::leftArm", seed(10, 1)],
        ["leaf::rightArm", seed(40, 1)],
        ["carry::leftArm", seed(5, 1)],
      ]),
      new Map<string, IAutoMovieSwivelSeed | null>([
        ["leaf::leftArm", seed(30, 1)],
        ["leaf::rightArm", seed(80, -1)],
      ]),
    ],
  };

  // 2. One branch.
  const start: ReadonlyMap<string, IAutoMovieSwivelSeed | null> =
    readHumanSegmentAnchors(segment, 1)!;
  const middle: ReadonlyMap<string, IAutoMovieSwivelSeed | null> =
    readHumanSegmentAnchors(segment, 1.0025)!;
  TestValidator.predicate(
    "one branch lies on the quintic through its anchors",
    nclose(start.get("leaf::leftArm")!.swivel, 10, ROUNDING) &&
      nclose(middle.get("leaf::leftArm")!.swivel, 20, ROUNDING),
  );

  // 3. Two branches.
  TestValidator.predicate(
    "across branches the nearer anchor's seed",
    readHumanSegmentAnchors(segment, 1.002)!.get("leaf::rightArm")!.swivel ===
      40 &&
      readHumanSegmentAnchors(segment, 1.004)!.get("leaf::rightArm")!.swivel ===
        80,
  );

  // 4. One anchor's fit.
  TestValidator.predicate(
    "a fit of one anchor keeps its seed",
    readHumanSegmentAnchors(segment, 1.004)!.get("carry::leftArm")!.swivel ===
      5,
  );
}
