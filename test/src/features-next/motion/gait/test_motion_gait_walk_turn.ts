import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** One walk's turn from the previous walk's heading. */
interface ITurn {
  /** Degrees, positive to the left. */
  degrees: number;

  /** The case's name. */
  label: string;
}

/** The first walk's length straight ahead, metres. */
const AHEAD: number = 1.5;

/** The turned walk's length, metres. */
const TURNED: number = 1.2;

/** How near the turned walk's root must arrive, metres. */
const ARRIVE: number = 0.05;

/** The turns: each amplitude, and the reported one on both sides. */
const TURNS: readonly ITurn[] = [
  { degrees: 30, label: "30° left" },
  { degrees: 60, label: "60° left" },
  { degrees: -60, label: "60° right" },
  { degrees: -90, label: "90° right" },
];

/**
 * A walk that sets off at an angle to the walk before it turns with a step
 * turn, never a crossover through the stance leg.
 *
 * Scenarios, on the average man and the small woman, for each turn:
 * 1. A walk straight ahead, then a walk turned 30° left, 60° left, 60°
 *    right or 90° right, passes the take verdicts: no leg passes through
 *    the other, no pop at the join, contacts hold and joints stay in range.
 * 2. The turned walk arrives where it was sent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and the checks.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed take through the shipped verdicts and the arrival; a crossover tangles the legs and fails.
 * @evidence contracts/development/testing.md#independent-expectations The destinations follow from the turn's angle alone.
 * @evidence contracts/development/testing.md#distinguishing-cases Each amplitude, both sides of the reported turn, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance through the public chain.
 */
export function test_motion_gait_walk_turn(): void {
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    for (const turn of TURNS) {
      const radians: number = (turn.degrees * Math.PI) / 180;
      const to: IAutoMovieVector3 = {
        x: TURNED * Math.sin(radians),
        y: 0,
        z: AHEAD + TURNED * Math.cos(radians),
      };
      const take: HumanPerformance = new HumanPerformance({
        seed: "walk-turn",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .walk({ to: { x: 0, y: 0, z: AHEAD } })
          .walk({ to }).node,
      });
      const label: string = `${fit} walking on, turned ${turn.label}`;
      assertTakeClean(label, take);
      const root: IAutoMovieVector3 = take.posture("a", take.duration).root;
      TestValidator.predicate(
        `${label}: arrives within ${ARRIVE} m`,
        Math.hypot(root.x - to.x, root.z - to.z) <= ARRIVE,
      );
    }
  }
}
