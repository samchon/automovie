import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { lieTogetherScene } from "../../internal/lieTogetherScene";
import { motionActionUnit } from "../../internal/motionActionUnit";

/** One body lying alone in one position, as a way of lying together has it lie. */
interface ILie {
  /** The body. */
  body: motionHumanBody.Name;

  /** How it lies. */
  position: IAutoMovieMotionHumanLieDown.Position;
}

/**
 * The lyings the two ways stage: the average man on either side, the small
 * woman on her left side and on her back.
 */
const LIES: readonly ILie[] = [
  { body: "m-average", position: "lateralLeft" },
  { body: "m-average", position: "lateralRight" },
  { body: "f-small", position: "lateralLeft" },
  { body: "f-small", position: "supine" },
];

/**
 * Each body lies down alone on the floor, on its own: the lieDown steps of
 * `test_motion_sleep_lie_together` (the partner's and the performer's), in
 * every position its two ways stage, entered standing at the origin (the lying
 * down is each body's first action there too).
 *
 * Scenarios:
 *
 * 1. Lain down, no bone lies more than 10 mm under the floor.
 * 2. The lying down keeps the shipped bounds over its own span.
 *
 * The original reads only the lying together; its staging reads these lyings
 * alone once for each body's place, as this unit performs them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's steps it decomposes, the entry, the bodies, the positions and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Performs each lying down alone and reads every displayed bone against the floor and the verdict report over the lying down's span; a body through the floor or a finding in the lying down fails.
 * @evidence contracts/development/testing.md#independent-expectations The floor bound is the original's; the rest the verdicts' shipped limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies in the three positions the ways stage; lying together is the way units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_sleep_lie_together_lie_down`.
 */
export function test_motion_sleep_lie_together_lie_down(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const lie of LIES) {
    const label: string = `${lie.body} lies ${lie.position}`;
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(lie.body);
      const film: HumanPerformance = lieTogetherScene.lieAlone(
        body,
        lie.position,
      );
      const low: number = Math.min(
        ...[...film.bones("x", film.duration).values()].map(
          (bone: IAutoMovieResolvedBone): number => bone.worldPosition.y,
        ),
      );
      checks.check(
        `${label}: no bone under the floor (${(low * 1000).toFixed(1)} mm)`,
        low >= -lieTogetherScene.FLOOR,
      );
      const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
        film,
        "x",
        "lieDown",
      );
      motionActionUnit.bounds(checks, label, film, "x", act);
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("each body lies down on the floor");
}
