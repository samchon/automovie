import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  ballStrikeCaseBall
} from "../../../../../packages/motions/src/executable/cases/internal/ballStrikeCaseBall";
import {
  HumanBall
} from "../../../../../packages/motions/src/ballStrike/internal/HumanBall";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `ballStrikeCaseBall` stages a ball for the kick captures with the contact
 * `createBall` declares: a power grip at its centre whose aperture is its
 * diameter, so a law reading the ball (`HumanBall.placed`) finds its own centre
 * and radius.
 *
 * Scenarios:
 *
 * 1. An 0.11 m ball at (0.2, 0.11, 0.4) reads back that centre and radius.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines staged ball contact geometry and reading its own center and radius.
 * @evidence contracts/development/testing.md#behavioral-verification Stages the execution case at its authored position and reads it through the motion ball placement operation.
 * @evidence contracts/development/testing.md#independent-expectations The fixed center (0.2, 0.11, 0.4) and 0.11 m radius recover through the diameter-based affordance, exposing center or aperture drift.
 */
export function test_motions_executable_ball_strike_case_ball(): void {
  const prop: IAutoMovieMotionHumanProp = ballStrikeCaseBall(
    { x: 0.2, y: 0.11, z: 0.4 },
    0.11,
  );
  const read: HumanBall.IBall = HumanBall.placed(
    prop,
    (): IAutoMovieRigidTransform => prop.frame,
    "ball",
  );
  TestValidator.predicate(
    "the ball's own centre and radius",
    vclose(read.centre, { x: 0.2, y: 0.11, z: 0.4 }, 1e-12) &&
      Math.abs(read.radius - 0.11) <= 1e-12 &&
      prop.affordances![0]!.grip === "power",
  );
}
